"""
File Upload Routes
文件上传API - 支持本地存储
"""

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Path
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path as PathlibPath
from datetime import datetime

from app.core.storage_paths import (
    UPLOAD_AUDIO_DIR,
    UPLOAD_IMAGES_DIR,
    UPLOAD_TEXTS_DIR,
    ensure_upload_dirs,
)
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.permissions import verify_user_is_active, verify_user_task_access
from app.services.task_service import TaskService
from app.services.id_service import new_id
from app.schemas.tasks import DatasetRegistrationRequest, DatasetItemInput

router = APIRouter()
download_router = APIRouter()  # 单独的下载路由，注册到根级别
fixtures_router = APIRouter()

ensure_upload_dirs()

# 允许的文件类型
ALLOWED_IMAGE_TYPES = {
    "image/jpeg", 
    "image/png", 
    "image/gif", 
    "image/webp",
    "image/bmp"
}
ALLOWED_TEXT_TYPES = {
    "text/plain", 
    "application/json", 
    "text/csv",
    "application/pdf"
}
ALLOWED_AUDIO_TYPES = {
    "audio/mpeg",
    "audio/wav",
    "audio/x-wav",
    "audio/mp4",
    "audio/webm",
    "audio/ogg",
    "audio/aac",
    "audio/x-m4a",
    "audio/m4a",
}

# 文件大小限制 (100MB)
MAX_FILE_SIZE = 100 * 1024 * 1024


# ==================== 工具函数 ====================

def get_file_extension(filename: str) -> str:
    """获取文件扩展名"""
    return PathlibPath(filename).suffix.lower()


def validate_image_file(file: UploadFile, content: bytes) -> tuple[bool, str]:
    """验证图片文件"""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        return False, f"Invalid image type: {file.content_type}. Allowed: {', '.join(ALLOWED_IMAGE_TYPES)}"
    
    if len(content) > MAX_FILE_SIZE:
        return False, f"File too large: {len(content) / 1024 / 1024:.2f}MB (max: 100MB)"
    
    return True, ""


def validate_text_file(file: UploadFile, content: bytes) -> tuple[bool, str]:
    """验证文本文件"""
    if file.content_type not in ALLOWED_TEXT_TYPES:
        return False, f"Invalid text type: {file.content_type}. Allowed: {', '.join(ALLOWED_TEXT_TYPES)}"
    
    if len(content) > MAX_FILE_SIZE:
        return False, f"File too large: {len(content) / 1024 / 1024:.2f}MB (max: 100MB)"
    
    return True, ""


def validate_audio_file(file: UploadFile, content: bytes) -> tuple[bool, str]:
    """验证音频文件"""
    if file.content_type not in ALLOWED_AUDIO_TYPES:
        return False, f"Invalid audio type: {file.content_type}. Allowed: {', '.join(sorted(ALLOWED_AUDIO_TYPES))}"

    if len(content) > MAX_FILE_SIZE:
        return False, f"File too large: {len(content) / 1024 / 1024:.2f}MB (max: 100MB)"

    return True, ""


# ==================== 图片上传 ====================

@router.post("/{task_id}/upload-images", status_code=201)
async def upload_images(
    task_id: str = Path(..., description="Task ID"),
    files: list[UploadFile] = File(..., description="Image files to upload"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """批量上传图片文件
    
    支持格式: JPG, PNG, GIF, WebP, BMP
    最大文件: 100MB
    
    返回创建的 DataPointers 和 TaskItems
    
    示例:
    ```bash
    curl -X POST http://localhost:8000/api/tasks/task_001/upload-images \\
      -H "Authorization: Bearer TOKEN" \\
      -F "files=@photo1.jpg" \\
      -F "files=@photo2.jpg"
    ```
    """
    # 验证用户状态
    verify_user_is_active(current_user)
    
    # 验证任务访问权限
    task_service = TaskService(db=db)
    task = task_service.get_task(task_id)
    verify_user_task_access(current_user, task, db)
    
    try:
        if not files:
            raise HTTPException(status_code=400, detail="No files provided")
        
        upload_results = []
        dataset_items = []
        
        for file in files:
            # 1. 读取文件内容
            file_content = await file.read()
            
            # 2. 验证文件
            is_valid, error_msg = validate_image_file(file, file_content)
            if not is_valid:
                raise HTTPException(status_code=400, detail=error_msg)
            
            # 3. 生成唯一文件名
            file_ext = get_file_extension(file.filename)
            unique_filename = f"{new_id('img')}{file_ext}"
            file_path = UPLOAD_IMAGES_DIR / unique_filename
            
            # 4. 保存文件
            with open(file_path, "wb") as f:
                f.write(file_content)
            
            # 5. 生成 location_ref（相对于 /api 的路径）
            location_ref = f"uploads/images/{unique_filename}"
            
            # 6. 生成预览数据
            payload_preview = {
                "url": location_ref,
                "filename": file.filename,
                "size": str(len(file_content)),
                "type": "image",
                "uploaded_at": datetime.now().isoformat(),
                "mime_type": file.content_type
            }
            
            # 7. 创建 DatasetItemInput
            dataset_item = DatasetItemInput(
                external_item_ref=file.filename,
                location_ref=location_ref,
                payload_preview=payload_preview,
                access_policy_ref="private",
                source_version_ref="v1"
            )
            
            dataset_items.append(dataset_item)
            upload_results.append({
                "original_name": file.filename,
                "stored_as": unique_filename,
                "location_ref": location_ref,
                "size_bytes": len(file_content),
                "mime_type": file.content_type,
                "local_path": str(file_path)
            })
        
        # 8. 通过 dataset-registration 创建 TaskItems 和 DataPointers
        registration_payload = DatasetRegistrationRequest(items=dataset_items)
        pointers, task_items = task_service.register_dataset(
            task_id,
            registration_payload,
            operator_id=current_user.get("user_id"),
            intake_source="image_upload",
            intake_file_count=len(files),
        )

        # 9. 构建响应（使用原始 dataset_items 中的 payload_preview，确保包含完整信息）
        task_item_responses = []
        for i, task_item in enumerate(task_items):
            pointer = pointers[i]
            # 使用原始的 payload_preview，确保包含 url, filename 等完整字段
            original_payload = dataset_items[i].payload_preview
            
            task_item_responses.append({
                "id": task_item.id,
                "task_id": task_item.task_id,
                "external_item_ref": task_item.external_item_ref,
                "location_ref": pointer.location_ref,
                "status": task_item.status,
                "payload_preview": original_payload,  # 使用完整的原始 payload_preview
                "data_pointer_id": task_item.data_pointer_id
            })
        
        return {
            "status": "success",
            "message": f"Successfully uploaded {len(files)} image(s)",
            "uploaded_files": upload_results,
            "created_data_pointers": len(pointers),
            "created_task_items": len(task_items),
            "task_items": task_item_responses
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Image upload failed: {str(e)}"
        )


# ==================== 文本上传 ====================

@router.post("/{task_id}/upload-texts", status_code=201)
async def upload_texts(
    task_id: str = Path(..., description="Task ID"),
    files: list[UploadFile] = File(..., description="Text files to upload"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """批量上传文本文件
    
    支持格式: TXT, JSON, CSV, PDF
    最大文件: 100MB
    
    返回创建的 DataPointers 和 TaskItems
    
    示例:
    ```bash
    curl -X POST http://localhost:8000/api/tasks/task_001/upload-texts \\
      -H "Authorization: Bearer TOKEN" \\
      -F "files=@feedback1.txt" \\
      -F "files=@feedback2.json"
    ```
    """
    # 验证用户状态
    verify_user_is_active(current_user)
    
    # 验证任务访问权限
    task_service = TaskService(db=db)
    task = task_service.get_task(task_id)
    verify_user_task_access(current_user, task, db)
    
    try:
        if not files:
            raise HTTPException(status_code=400, detail="No files provided")
        
        upload_results = []
        dataset_items = []
        
        for file in files:
            # 1. 读取文件内容
            file_content = await file.read()
            
            # 2. 验证文件
            is_valid, error_msg = validate_text_file(file, file_content)
            if not is_valid:
                raise HTTPException(status_code=400, detail=error_msg)
            
            # 3. 生成唯一文件名
            file_ext = get_file_extension(file.filename)
            unique_filename = f"{new_id('txt')}{file_ext}"
            file_path = UPLOAD_TEXTS_DIR / unique_filename
            
            # 4. 保存文件
            with open(file_path, "wb") as f:
                f.write(file_content)
            
            # 5. 生成 location_ref（相对于 /api 的路径）
            location_ref = f"uploads/texts/{unique_filename}"
            
            # 6. 提取文本预览
            try:
                text_content = file_content.decode('utf-8', errors='ignore')
            except:
                text_content = ""
            
            preview_text = text_content[:200] + "..." if len(text_content) > 200 else text_content
            
            # 7. 生成预览数据
            payload_preview = {
                "url": location_ref,
                "filename": file.filename,
                "size": str(len(file_content)),
                "type": "text",
                "uploaded_at": datetime.now().isoformat(),
                "mime_type": file.content_type,
                "preview": preview_text,
                "char_count": str(len(text_content))
            }
            
            # 8. 创建 DatasetItemInput
            dataset_item = DatasetItemInput(
                external_item_ref=file.filename,
                location_ref=location_ref,
                payload_preview=payload_preview,
                access_policy_ref="private",
                source_version_ref="v1"
            )
            
            dataset_items.append(dataset_item)
            upload_results.append({
                "original_name": file.filename,
                "stored_as": unique_filename,
                "location_ref": location_ref,
                "size_bytes": len(file_content),
                "mime_type": file.content_type,
                "char_count": len(text_content),
                "preview": preview_text[:50],
                "local_path": str(file_path)
            })
        
        # 9. 通过 dataset-registration 创建 TaskItems 和 DataPointers
        registration_payload = DatasetRegistrationRequest(items=dataset_items)
        pointers, task_items = task_service.register_dataset(
            task_id,
            registration_payload,
            operator_id=current_user.get("user_id"),
            intake_source="text_upload",
            intake_file_count=len(files),
        )

        # 10. 构建响应
        task_item_responses = []
        for i, task_item in enumerate(task_items):
            pointer = pointers[i]
            task_item_responses.append({
                "id": task_item.id,
                "task_id": task_item.task_id,
                "external_item_ref": task_item.external_item_ref,
                "location_ref": pointer.location_ref,
                "status": task_item.status,
                "payload_preview": task_item.payload_preview,
                "data_pointer_id": task_item.data_pointer_id
            })
        
        return {
            "status": "success",
            "message": f"Successfully uploaded {len(files)} text file(s)",
            "uploaded_files": upload_results,
            "created_data_pointers": len(pointers),
            "created_task_items": len(task_items),
            "task_items": task_item_responses
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Text upload failed: {str(e)}"
        )


# ==================== 音频上传 ====================

@router.post("/{task_id}/upload-audio", status_code=201)
async def upload_audio(
    task_id: str = Path(..., description="Task ID"),
    files: list[UploadFile] = File(..., description="Audio files to upload"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """批量上传音频文件
    
    支持格式: MP3, WAV, M4A, AAC, OGG, WebM
    最大文件: 100MB
    
    返回创建的 DataPointers 和 TaskItems
    """
    verify_user_is_active(current_user)

    task_service = TaskService(db=db)
    task = task_service.get_task(task_id)
    verify_user_task_access(current_user, task, db)

    try:
        if not files:
            raise HTTPException(status_code=400, detail="No files provided")

        upload_results = []
        dataset_items = []

        for file in files:
            file_content = await file.read()
            is_valid, error_msg = validate_audio_file(file, file_content)
            if not is_valid:
                raise HTTPException(status_code=400, detail=error_msg)

            file_ext = get_file_extension(file.filename)
            unique_filename = f"{new_id('aud')}{file_ext}"
            file_path = UPLOAD_AUDIO_DIR / unique_filename

            with open(file_path, "wb") as f:
                f.write(file_content)

            location_ref = f"uploads/audio/{unique_filename}"
            payload_preview = {
                "url": location_ref,
                "filename": file.filename,
                "size": len(file_content),
                "type": "audio",
                "uploaded_at": datetime.now().isoformat(),
                "mime_type": file.content_type,
            }

            dataset_item = DatasetItemInput(
                external_item_ref=file.filename,
                location_ref=location_ref,
                payload_preview=payload_preview,
                access_policy_ref="private",
                source_version_ref="v1",
            )

            dataset_items.append(dataset_item)
            upload_results.append(
                {
                    "original_name": file.filename,
                    "stored_as": unique_filename,
                    "location_ref": location_ref,
                    "size_bytes": len(file_content),
                    "mime_type": file.content_type,
                    "local_path": str(file_path),
                }
            )

        registration_payload = DatasetRegistrationRequest(items=dataset_items)
        pointers, task_items = task_service.register_dataset(
            task_id,
            registration_payload,
            operator_id=current_user.get("user_id"),
            intake_source="audio_upload",
            intake_file_count=len(files),
        )

        task_item_responses = []
        for i, task_item in enumerate(task_items):
            pointer = pointers[i]
            original_payload = dataset_items[i].payload_preview
            task_item_responses.append(
                {
                    "id": task_item.id,
                    "task_id": task_item.task_id,
                    "external_item_ref": task_item.external_item_ref,
                    "location_ref": pointer.location_ref,
                    "status": task_item.status,
                    "payload_preview": original_payload,
                    "data_pointer_id": task_item.data_pointer_id,
                }
            )

        return {
            "status": "success",
            "message": f"Successfully uploaded {len(files)} audio file(s)",
            "uploaded_files": upload_results,
            "created_data_pointers": len(pointers),
            "created_task_items": len(task_items),
            "task_items": task_item_responses,
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Audio upload failed: {str(e)}")


# ==================== 文件下载 ====================

@download_router.get("/{file_type}/{filename:path}", tags=["file-downloads"])
async def download_file(
    file_type: str = Path(..., pattern="^(images|texts|audio)$"),
    filename: str = Path(...),
):
    """下载上传的文件
    
    - file_type: 'images'、'texts' 或 'audio'
    - filename: 文件名 (不包含路径)
    
    示例:
    ```bash
    curl -X GET http://localhost:8000/api/v1/uploads/images/img_abc123.jpg \\
      -o downloaded_image.jpg
    ```
    """
    # 注意：此端点不需要认证，因为：
    # 1. 文件名已经是随机生成的唯一值，难以猜测
    # 2. 前端用户已经通过任务权限检查
    # 3. HTML <img> 标签无法发送 Authorization header
    
    if file_type == "images":
        file_path = UPLOAD_IMAGES_DIR / filename
    elif file_type == "texts":
        file_path = UPLOAD_TEXTS_DIR / filename
    elif file_type == "audio":
        file_path = UPLOAD_AUDIO_DIR / filename
    else:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"File not found: {filename}"
        )
    
    return FileResponse(file_path)


@fixtures_router.get("/{file_path:path}", tags=["fixture-downloads"])
async def download_fixture(file_path: str = Path(...)):
    """Serve committed mock fixtures for mock://fixtures/... location refs."""
    from app.services.data_access_service import _safe_fixture_path

    try:
        resolved = _safe_fixture_path(file_path)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not resolved.is_file():
        raise HTTPException(status_code=404, detail=f"Fixture not found: {file_path}")
    return FileResponse(resolved)


# ==================== 存储信息查询 ====================

@router.get("/storage/info", tags=["storage"])
async def get_storage_info(
    current_user: dict = Depends(get_current_user),
):
    """获取存储信息
    
    返回本地存储目录的统计信息
    """
    verify_user_is_active(current_user)
    
    def get_dir_size(path: PathlibPath) -> int:
        """计算目录大小"""
        total_size = 0
        for entry in path.rglob("*"):
            if entry.is_file():
                total_size += entry.stat().st_size
        return total_size
    
    images_size = get_dir_size(UPLOAD_IMAGES_DIR)
    texts_size = get_dir_size(UPLOAD_TEXTS_DIR)
    audio_size = get_dir_size(UPLOAD_AUDIO_DIR)
    total_size = images_size + texts_size + audio_size
    
    # 计算文件数量
    images_count = len(list(UPLOAD_IMAGES_DIR.glob("*")))
    texts_count = len(list(UPLOAD_TEXTS_DIR.glob("*")))
    audio_count = len(list(UPLOAD_AUDIO_DIR.glob("*")))
    
    return {
        "storage_location": str(UPLOAD_BASE_DIR.absolute()),
        "total_size_bytes": total_size,
        "total_size_mb": round(total_size / 1024 / 1024, 2),
        "max_file_size_mb": MAX_FILE_SIZE / 1024 / 1024,
        "directories": {
            "images": {
                "path": str(UPLOAD_IMAGES_DIR),
                "file_count": images_count,
                "size_bytes": images_size,
                "size_mb": round(images_size / 1024 / 1024, 2)
            },
            "texts": {
                "path": str(UPLOAD_TEXTS_DIR),
                "file_count": texts_count,
                "size_bytes": texts_size,
                "size_mb": round(texts_size / 1024 / 1024, 2)
            },
            "audio": {
                "path": str(UPLOAD_AUDIO_DIR),
                "file_count": audio_count,
                "size_bytes": audio_size,
                "size_mb": round(audio_size / 1024 / 1024, 2)
            }
        },
        "allowed_image_types": list(ALLOWED_IMAGE_TYPES),
        "allowed_text_types": list(ALLOWED_TEXT_TYPES),
        "allowed_audio_types": list(ALLOWED_AUDIO_TYPES)
    }

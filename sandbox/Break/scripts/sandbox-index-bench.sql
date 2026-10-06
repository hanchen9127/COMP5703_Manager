\pset format unaligned
\pset tuples_only on
\set q1 'SELECT * FROM role_assignments WHERE user_id = 15000 AND organization_id = 1 AND project_id IS NULL AND scope = ''organization'' AND revoked_at IS NULL'
\set q2 'SELECT * FROM audit_logs WHERE task_id = ''task_f6d71692c0d6_r250'' AND operation = ''draft_submitted'' AND resource_type = ''task_item'' ORDER BY created_at DESC'
\set q3 'SELECT * FROM audit_logs WHERE task_id = ''task_f6d71692c0d6_r250'' ORDER BY created_at DESC LIMIT 50 OFFSET 0'
\set q4 'SELECT count(*) FROM (SELECT * FROM audit_logs WHERE task_id = ''task_f6d71692c0d6_r250'') AS anon_1'
\set q5 'SELECT * FROM task_items WHERE task_id = ''task_big'' AND status = ''expert_send_back'''
\set q6 'SELECT * FROM task_items LEFT OUTER JOIN data_pointers ON data_pointers.id = task_items.data_pointer_id WHERE task_items.task_id = ''task_big'''
\set q7 'SELECT * FROM annotations WHERE task_item_id = (SELECT id FROM task_items WHERE task_id=''task_big'' ORDER BY id LIMIT 1) AND created_by = 9 AND is_latest IS true LIMIT 1'
\set q8 'SELECT drafts.* FROM drafts JOIN task_items ON task_items.id = drafts.task_item_id WHERE task_items.task_id = ''task_big'' ORDER BY drafts.created_at DESC'
\set q9 'SELECT DISTINCT annotations.task_item_id FROM annotations JOIN task_items ON task_items.id = annotations.task_item_id WHERE task_items.task_id = ''task_big'' AND annotations.created_by = 9 AND annotations.is_latest IS true'
\set q10 'SELECT * FROM task_item_escalations WHERE task_id = ''task_f6d71692c0d6_r250'' AND status = ''decided'' AND decided_at IS NOT NULL ORDER BY decided_at DESC'
\set q11 'SELECT * FROM drafts WHERE task_item_id = (SELECT id FROM task_items WHERE task_id=''task_big'' ORDER BY id LIMIT 1) ORDER BY created_at DESC'

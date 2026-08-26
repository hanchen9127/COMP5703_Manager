"use client"

import { Input } from "@workspace/ui/components/input"

type PolicyRefFieldProps = {
  id: string
  label: string
  value: string
  suggestions: readonly string[]
  placeholder?: string
  onChange: (value: string) => void
}

export function PolicyRefField({
  id,
  label,
  value,
  suggestions,
  placeholder,
  onChange,
}: PolicyRefFieldProps) {
  const listId = `${id}-suggestions`

  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <Input
        id={id}
        list={listId}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="font-mono text-[13px]"
      />
      <datalist id={listId}>
        {suggestions.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>
      <p className="text-[11px] text-slate-500">Choose a known bundle or type a custom ref id.</p>
    </div>
  )
}

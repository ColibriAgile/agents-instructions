# Never execute the commands bellow with `rtk`

## PowerShell Output Optimization

When running PowerShell commands, prefer forms that minimize output while preserving the information needed to complete the task. Avoid returning default formatted tables when a simpler representation is sufficient.

## PowerShell Command Optimization

### Get-ChildItem or ls or dir 
  
`Get-ChildItem | ForEach-Object { if ($_.PSIsContainer) { "$($_.Name)/" } else { $_.Name } }`

### Get-Content <file>
  
`Get-Content <file> -Tail 100`
`Get-Content <file> -TotalCount 100`
`Get-Content <file> -Raw` (only when the entire file is required)

### Get-History

`Get-History -Count 20`

### Get-Location

`(Get-Location).Path`

### Get-Process

`Get-Process | Select-Object ProcessName, Id`

### Get-ItemProperty <path>

`Get-ItemProperty <path> | Select-Object <RequiredProperties>`

### Group-Object

`Group-Object -NoElement`

### Select-Object

Select only the properties required for the current task.

### General Guidance

- Prefer object properties over PowerShell's default formatted tables.
- Return only the fields necessary to answer the current question.
- Filter as early as possible using `Where-Object` or cmdlet-specific parameters.
- Limit the number of returned items whenever possible.
- Avoid producing verbose output that increases token usage without adding value.
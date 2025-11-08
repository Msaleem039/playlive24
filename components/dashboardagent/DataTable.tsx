import React from 'react'

interface Column {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
}

interface DataTableProps {
  title: string
  columns: Column[]
  data: Record<string, any>[]
  emptyMessage?: string
  className?: string
}

export function DataTable({ 
  title, 
  columns, 
  data, 
  emptyMessage = "No data available",
  className = ""
}: DataTableProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${className}`}>
      <div className="bg-black text-white px-4 py-2">
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div className="p-4">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              {columns.map((column) => (
                <th 
                  key={column.key}
                  className={`py-2 text-sm font-medium text-gray-600 ${
                    column.align === 'right' ? 'text-right' : 
                    column.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, index) => (
                <tr key={index} className="border-b">
                  {columns.map((column) => (
                    <td 
                      key={column.key}
                      className={`py-2 text-sm ${
                        column.align === 'right' ? 'text-right font-medium' : 
                        column.align === 'center' ? 'text-center' : 'text-left'
                      }`}
                    >
                      {row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-8 text-center text-gray-500 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

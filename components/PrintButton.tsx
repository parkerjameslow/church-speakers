'use client'
export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm print:hidden"
    >
      Print / Save PDF
    </button>
  )
}

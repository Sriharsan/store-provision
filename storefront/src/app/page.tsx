"use client"

import { useEffect, useState } from "react"

export default function Home() {

  const [stores, setStores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    fetch("/api/stores")
      .then(res => res.json())
      .then(data => {
        setStores(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })

  }, [])

  if (loading) {
    return <div className="p-10">Loading stores...</div>
  }

  return (

    <main className="p-10">

      <h1 className="text-3xl font-bold mb-6">
        🚀 Store Provisioning Dashboard
      </h1>

      <div className="grid grid-cols-3 gap-6">

        {stores.map((s: any) => (

          <div key={s.id} className="border p-4 rounded shadow">

            <h2 className="font-semibold">{s.id}</h2>

            <a
              href={s.url}
              target="_blank"
              className="mt-3 inline-block bg-black text-white px-4 py-2 rounded"
            >
              Open Store
            </a>

          </div>

        ))}

      </div>

    </main>
  )
}

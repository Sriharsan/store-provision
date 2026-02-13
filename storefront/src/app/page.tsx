"use client"

import { useEffect, useState } from "react"

export default function Home() {

  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    async function loadProducts() {
      try {
        const res = await fetch(
          "/store/products",
          {
            headers: {
              "x-publishable-api-key":
                "pk_a35be6eda5cbe41c2de6a07f00554834cc110bb4ca2d72f41ae3a133b3fec959"
            }
          }
        )

        const data = await res.json()
        setProducts(data.products || [])

      } catch (err) {
        console.error(err)
      }

      setLoading(false)
    }

    loadProducts()

  }, [])

  function addToCart(p: any) {
    setCart([...cart, p])
    alert("✅ Added to cart!")
  }

  function checkout() {
    alert("🎉 Order placed successfully (Demo Checkout)")
    setCart([])
  }

  if (loading) return <div style={{ padding: 40 }}>Loading products...</div>

  return (
    <main style={{ padding: 40, fontFamily: "sans-serif" }}>

      <h1>🚀 Medusa Storefront Demo</h1>

      <h3>Products</h3>

      {products.map(p => (
        <div key={p.id}
          style={{
            border: "1px solid #ddd",
            padding: 15,
            marginBottom: 10,
            borderRadius: 8
          }}
        >
          <b>{p.title}</b>

          <br />

          <button
            style={{
              marginTop: 10,
              padding: "6px 12px",
              background: "#000",
              color: "#fff",
              borderRadius: 6,
              cursor: "pointer"
            }}
            onClick={() => addToCart(p)}
          >
            Add to Cart
          </button>

        </div>
      ))}

      <hr />

      <h3>Cart ({cart.length})</h3>

      {cart.map((c, i) => (<div key={i}>{c.title}</div>))}

      {cart.length > 0 && (
        <button
          style={{
            marginTop: 10,
            padding: "10px 20px",
            background: "green",
            color: "#fff",
            borderRadius: 8,
            cursor: "pointer"
          }}
          onClick={checkout}
        >
          Checkout
        </button>
      )}

    </main>
  )
}

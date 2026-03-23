'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminPage() {
  const [session, setSession] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])

  // 🔐 Get session
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
    }

    getSession()
  }, [])

  // 🔐 Check admin access
  useEffect(() => {
    if (!session?.user) return

    const checkAdmin = async () => {
      const { data, error } = await supabase
        .from('admins')
        .select('id')
        .eq('id', session.user.id)
        .single()

      if (data) {
        setIsAdmin(true)
        fetchData()
      } else {
        setLoading(false)
      }
    }

    checkAdmin()
  }, [session])

  // 📊 Fetch report data
  const fetchData = async () => {
    const { data, error } = await supabase
      .from('parents')
      .select(`
        id,
        parent_name,
        email,
        children (
          id,
          name,
          age_value,
          age_unit,
          child_interests (
            interests (
              name
            )
          )
        )
      `)

    if (error) {
      console.error(error)
    } else {
      setData(data)
    }

    setLoading(false)
  }

  // 🔐 Login handler
  const handleLogin = async () => {
    const email = prompt('Enter email')
    const password = prompt('Enter password')

    if (!email || !password) return

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert('Login failed')
    } else {
      location.reload()
    }
  }

  // 🔐 Logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    location.reload()
  }

  // 🚫 Not logged in
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h1 className="text-xl font-semibold">Admin Login</h1>
        <button
          onClick={handleLogin}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Login
        </button>
      </div>
    )
  }

  // 🚫 Not admin
  if (!isAdmin && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h1 className="text-xl text-red-500">❌ Not authorized</h1>
        <button
          onClick={handleLogout}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>
    )
  }

  // ⏳ Loading
  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  // ✅ Admin dashboard
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📊 Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-gray-700 text-white px-3 py-1 rounded-lg"
        >
          Logout
        </button>
      </div>

      <div className="space-y-6">
        {data.map((parent) => (
          <div
            key={parent.id}
            className="border rounded-xl p-4 shadow-sm bg-white"
          >
            <h2 className="text-lg font-semibold">
              {parent.parent_name} ({parent.email})
            </h2>

            <div className="mt-3 space-y-2">
              {parent.children?.map((child: any) => (
                <div
                  key={child.id}
                  className="p-3 border rounded-lg bg-gray-50"
                >
                  <p className="font-medium">
                    👶 {child.name} — {child.age_value} {child.age_unit}
                  </p>

                  <p className="text-sm text-gray-600">
                    Interests:{' '}
                    {child.child_interests
                      ?.map((ci: any) => ci.interests?.name)
                      .join(', ') || 'None'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
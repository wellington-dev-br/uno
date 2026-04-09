import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const username = typeof body.username === 'string' ? body.username.trim() : ''

  if (!email || !password || !username) {
    return NextResponse.json(
      { error: 'Email, senha e username são obrigatórios.' },
      { status: 400 }
    )
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Supabase não está configurado corretamente no ambiente.' },
      { status: 500 }
    )
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

  const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      username,
    },
  })

  if (createError) {
    return NextResponse.json(
      { error: createError.message || 'Falha ao criar usuário.' },
      { status: 400 }
    )
  }

  const userId = createData?.user?.id
  if (!userId) {
    return NextResponse.json(
      { error: 'Usuário criado, mas não foi possível recuperar o ID.' },
      { status: 500 }
    )
  }

  const { error: profileError } = await supabaseAdmin.from('users').insert({
    id: userId,
    email,
    username,
  })

  if (profileError) {
    return NextResponse.json(
      { error: profileError.message || 'Falha ao criar perfil.' },
      { status: 500 }
    )
  }

  const { error: statsError } = await supabaseAdmin.from('user_stats').insert({
    user_id: userId,
  })

  if (statsError) {
    return NextResponse.json(
      { error: statsError.message || 'Falha ao criar estatísticas do usuário.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ message: 'Usuário criado com sucesso.' }, { status: 201 })
}

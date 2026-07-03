import { NextRequest, NextResponse } from 'next/server'
import { createTransaction, listTransactions } from '@/lib/dynamodb'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const transactions = await listTransactions(userId, limit)
    return NextResponse.json({ transactions, count: transactions.length })
  } catch (error) {
    console.error('GET /api/transactions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, amount, description, category } = body

    if (!userId || !type || !amount) {
      return NextResponse.json({ error: 'userId, type, and amount are required' }, { status: 400 })
    }

    if (!['income', 'expense'].includes(type)) {
      return NextResponse.json({ error: 'type must be income or expense' }, { status: 400 })
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 })
    }

    const transaction = await createTransaction({
      userId,
      type,
      amount,
      description: description || '',
      category: category || 'uncategorized',
    })

    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error) {
    console.error('POST /api/transactions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

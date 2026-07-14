import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const pathMatch = url.pathname.match(/^\/api\/v1\/(.*?)(?:\?|$)/);
  const pathStr = pathMatch ? pathMatch[1] : '';
  const queryString = url.search;
  
  const backendUrl = `http://localhost:8000/api/v1/${pathStr}${queryString}`;
  
  try {
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Backend fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from backend' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const pathMatch = url.pathname.match(/^\/api\/v1\/(.*?)(?:\?|$)/);
  const pathStr = pathMatch ? pathMatch[1] : '';
  const body = await request.text();
  
  const backendUrl = `http://localhost:8000/api/v1/${pathStr}`;
  
  try {
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Backend fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to post to backend' },
      { status: 500 }
    );
  }
}

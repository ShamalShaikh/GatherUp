import { NextResponse } from 'next/server';
import ServerRequest, { type IRequest, type IResponse } from '@utils/ServerRequest';

// Helper function to parse parameters from request (either query params or body)
const parseParameters = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  let bodyParams: Record<string, any> = {};
  
  // If it's a POST request, try to get parameters from the body as well
  if (request.method === 'POST') {
    try {
      bodyParams = await request.json();
    } catch (error) {
      console.warn('Error parsing request body:', error);
      // Continue even if body parsing fails
    }
  }
  
  // Merge query parameters and body parameters (query parameters take precedence)
  return {
    limit: searchParams.get('limit') || bodyParams?.limit || '100',
    offset: searchParams.get('offset') || bodyParams?.offset || '0',
    keyword: searchParams.get('keyword') || bodyParams?.keyword || '',
    category: searchParams.get('category') || bodyParams?.category || '',
    location: searchParams.get('location') || bodyParams?.location || '',
    startDate: searchParams.get('startDate') || bodyParams?.startDate || '',
    endDate: searchParams.get('endDate') || bodyParams?.endDate || '',
  };
};

// Handle both GET and POST requests with the same logic
export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}

// Shared request handling logic
async function handleRequest(request: Request) {
  try {
    // Parse parameters from query string and/or body
    const params = await parseParameters(request);
    const { limit, offset, keyword, category, location, startDate, endDate } = params;
    
    // Log request details for debugging
    console.log('API Request:', {
      method: request.method,
      params
    });

    // Construct the API endpoint URL with query parameters
    let apiUrl = `getLandingEvents?limit=${limit}&offset=${offset}`;
    if (keyword) apiUrl += `&keyword=${encodeURIComponent(keyword)}`;
    if (category) apiUrl += `&category=${encodeURIComponent(category)}`;
    if (location) apiUrl += `&location=${encodeURIComponent(location)}`;
    if (startDate) apiUrl += `&startDate=${encodeURIComponent(startDate)}`;
    if (endDate) apiUrl += `&endDate=${encodeURIComponent(endDate)}`;

    // Prepare parameters for the internal API request
    const parameters: IRequest = {
      url: apiUrl,
      method: 'GET'
    };

    // Use the ServerRequest utility designed for server-side API calls
    const response: IResponse = await ServerRequest.getResponse(parameters);

    // Check if we got a valid response
    if (response.status === 200 && response.data?.data) {
      return NextResponse.json({ 
        events: response.data.data,
        total: response.data.data.length,
        status: 'success'
      });
    } else {
      const errorMessage = response.data?.title || 'Failed to fetch events';
      console.error('API error:', errorMessage, response);
      return NextResponse.json({ 
        events: [],
        total: 0,
        status: 'error',
        message: errorMessage
      }, { status: response.status || 500 });
    }
  } catch (error) {
    console.error('Error in events API route:', error);
    return NextResponse.json({ 
      events: [],
      total: 0,
      status: 'error',
      message: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
} 
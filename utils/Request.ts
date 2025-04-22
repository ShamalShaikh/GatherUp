'use client';

import base64 from 'base-64';
import axios, { type AxiosResponse, type AxiosError } from 'axios';

// interfaces
export interface IResponse {
  data: {
    title?: string;
    results?: any;
    data?: any;
  };
  status?: number;
}

export interface IRequest {
  url: string;
  method: string;
  postData?: any;
}

// variables
const auth = {
  username: 'shamal1',
  password: 'passwd2',
};

const createAuth = base64.encode(`${auth.username}:${auth.password}`);

/**
 * Generates the base URL for API requests.
 *
 * @return {string} The base URL for API requests.
 */
export const buildUrl = (): string => {
  return 'http://127.0.0.1:8080';
  // 'https://website-api.com';
};

/**
 * Parses a JSON string into a JavaScript object.
 *
 * @param {string} value - The JSON string to be parsed.
 * @return {any} The parsed JavaScript object or an error object.
 */
const parseResults = (value: string): any => {
  try {
    // Try to parse the JSON string
    const parse = JSON.parse(value);
    return parse;
  } catch (error) {
    // If parsing fails, return an error object
    console.error('Failed to parse JSON response:', error);
    console.error('Raw response text:', value.substring(0, 200) + '...');
    
    // Return a standard error object
    return {
      title: 'Invalid response format',
      error: 'The server response could not be parsed as JSON'
    };
  }
};

/**
 * This function makes a request to the API and returns the response.
 *
 * @param {IRequest} parameters - The parameters for the request.
 * @return {Promise<IResponse>} The response from the API.
 */
const getResponse = async (parameters: IRequest): Promise<IResponse> => {
  let response: AxiosResponse<any, any>;

  const url = `${buildUrl()}/${parameters.url}`;
   
  // Get JWT token from localStorage if available
  const token = localStorage.getItem('token');
  
  // Use JWT token if available, otherwise fall back to Basic Auth
  const headers = token 
    ? { Authorization: `Bearer ${token}` } 
    : { Authorization: `Basic ${createAuth}` };

  // const headers = { Authorization: `Basic ${createAuth}` };

  try {
    if (parameters.method === 'GET') {
      response = await axios.get(url, { headers, timeout: 15000 });
    } else if (parameters.method === 'POST') {
      response = await axios.post(url, parameters.postData, { headers, timeout: 15000 });
    } else {
      throw new Error('Invalid HTTP method. Please use GET or POST.');
    }

    const d: IResponse = {
      data: response.data,
      status: response.status,
    };

    return d;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const err = error;

      // Handle 401 Unauthorized - token expired or invalid
      if (err.response?.status === 401) {
        // Clear token and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Only redirect if we're in the browser
        if (typeof window !== 'undefined') {
          window.location.href = '/members/signin';
        }
      }

      const responseText: string = err.request?.responseText || '';
      let parsedResults;

      if (responseText && responseText.trim() !== '') {
        parsedResults = parseResults(responseText);
      } else {
        parsedResults = { title: err.message || 'Network error occurred' };
      }

      return {
        data: parsedResults,
        status: err.response?.status || 0,
      };
    } else {
      // Handle non-Axios errors
      return {
        data: {
          title: error instanceof Error ? error.message : 'Unknown error occurred',
        },
        status: 0,
      };
    }
  }
};

const Request = {
  getResponse,
};

export default Request;

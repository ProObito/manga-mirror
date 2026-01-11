import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MONGODB_URI = Deno.env.get('MONGODB_URI') || '';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, collection, data, query, update } = await req.json();
    
    console.log(`MongoDB API called with action: ${action}, collection: ${collection}`);
    
    if (!MONGODB_URI) {
      throw new Error('MongoDB URI not configured');
    }

    // Parse MongoDB URI to extract database info
    const uriMatch = MONGODB_URI.match(/mongodb(\+srv)?:\/\/[^\/]+\/([^?]+)/);
    const database = uriMatch ? uriMatch[2] : 'mangahub';

    // MongoDB Data API endpoint (Atlas)
    const dataApiUrl = Deno.env.get('MONGODB_DATA_API_URL') || 
      'https://data.mongodb-api.com/app/data-api/endpoint/data/v1';
    const apiKey = Deno.env.get('MONGODB_API_KEY') || '';

    let endpoint = '';
    let body: Record<string, unknown> = {
      dataSource: 'Cluster0',
      database,
      collection,
    };

    switch (action) {
      case 'findOne':
        endpoint = '/action/findOne';
        body.filter = query || {};
        break;
      case 'find':
        endpoint = '/action/find';
        body.filter = query || {};
        break;
      case 'insertOne':
        endpoint = '/action/insertOne';
        body.document = data;
        break;
      case 'insertMany':
        endpoint = '/action/insertMany';
        body.documents = data;
        break;
      case 'updateOne':
        endpoint = '/action/updateOne';
        body.filter = query || {};
        body.update = update;
        break;
      case 'updateMany':
        endpoint = '/action/updateMany';
        body.filter = query || {};
        body.update = update;
        break;
      case 'deleteOne':
        endpoint = '/action/deleteOne';
        body.filter = query || {};
        break;
      case 'deleteMany':
        endpoint = '/action/deleteMany';
        body.filter = query || {};
        break;
      case 'aggregate':
        endpoint = '/action/aggregate';
        body.pipeline = data || [];
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // If using MongoDB Atlas Data API
    if (apiKey) {
      const response = await fetch(`${dataApiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      console.log(`MongoDB ${action} on ${collection} completed`);
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fallback: Return mock response for development/testing
    console.log('MongoDB API Key not set, returning mock response');
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'MongoDB connection configured. Please set MONGODB_API_KEY for full functionality.',
      mockData: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in mongodb-api function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

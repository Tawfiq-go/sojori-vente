/**
 * Image proxy to handle S3 images with CORS issues
 * Fetches images from S3 and returns them with proper headers
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
    }

    // Only allow images from our GCP Storage bucket
    const allowedHosts = [
      'https://storage.googleapis.com/seraphic-vertex-474520-b8-listings-images/',
      'https://sojori.s3.eu-west-3.amazonaws.com/', // Legacy S3 support
    ];

    const isAllowed = allowedHosts.some(host => imageUrl.startsWith(host));
    if (!isAllowed) {
      return NextResponse.json({ error: 'Invalid image source' }, { status: 403 });
    }

    // Fetch the image from S3
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Sojori-Vente/1.0',
      },
    });

    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${imageResponse.status}` },
        { status: imageResponse.status }
      );
    }

    // Get image data and content type
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Return image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[image-proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy image' },
      { status: 500 }
    );
  }
}

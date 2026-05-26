import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseBlog = createClient(
  process.env.BLOG_SUPABASE_URL!,
  process.env.BLOG_SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    console.log("📸 Uploading image:", image.name, image.type, image.size);

    // Convert to buffer
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename in featured-images folder
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = image.name.split('.').pop();
    const fileName = `featured-images/${timestamp}-${randomString}.${fileExt}`;

    console.log("📸 Saving to:", fileName);

    // Upload
    const { data: uploadData, error: uploadError } = await supabaseBlog
      .storage
      .from('blog-images')
      .upload(fileName, buffer, {
        contentType: image.type,
        cacheControl: '31536000', // Cache for 1 year
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    console.log("✅ Upload successful:", uploadData);

    // Get public URL
    const { data: { publicUrl } } = supabaseBlog
      .storage
      .from('blog-images')
      .getPublicUrl(fileName);

    console.log("✅ Public URL:", publicUrl);

    return NextResponse.json({ url: publicUrl });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
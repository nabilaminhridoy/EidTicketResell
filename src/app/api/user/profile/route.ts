import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { uploadCloudinaryBuffer } from '@/lib/cloudinary';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
         name: true,
         email: true,
         phone: true,
         avatar: true,
         isIdVerified: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile: user });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const formData = await req.formData();
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const avatarFile = formData.get('avatar') as File | null;

    let avatarUrl: string | undefined = undefined;

    // Handle Cloudinary Multipart File logic natively inside Next
    if (avatarFile && avatarFile.size > 0) {
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      if (avatarFile.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "Avatar size exceeds 5MB limit" }, { status: 400 });
      }

      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      const cldResponse = await uploadCloudinaryBuffer(buffer, `user_avatars/${session.id}`);
      avatarUrl = cldResponse.secure_url;
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
       const userBase = await tx.user.update({
         where: { id: session.id },
         data: {
           ...(name && { name }),
           ...(phone && { phone }),
           ...(avatarUrl && { avatar: avatarUrl }),
         }
       });

       await tx.auditLog.create({
         data: {
           userId: session.id,
           action: "PROFILE_UPDATED",
           details: { updatedFields: Object.keys(formData).filter(k=>k!=='avatar') },
           ipAddress: req.ip || "Unknown"
         }
       });
       return userBase;
    });

    return NextResponse.json({ 
      success: true, 
      message: "Profile updated successfully.",
      user: {
        name: updatedUser.name,
        avatar: updatedUser.avatar,
        phone: updatedUser.phone
      }
    });

  } catch (error: any) {
    console.error("PROFILE_ERROR:", error);
    // Explicitly check for Prisma Unique Constraint (Phone mapping reuse)
    if (error.code === 'P2002') {
       return NextResponse.json({ error: "Phone number already connected to another account." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

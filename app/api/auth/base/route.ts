import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { address, signature, message, baseName } = await request.json();

        // Verify inputs
        if (!address || !signature || !message) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Verify the signature
        const recoveredAddress = ethers.verifyMessage(message, signature);

        if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
            return NextResponse.json(
                { message: 'Invalid signature' },
                { status: 401 }
            );
        }

        // Check if user exists in database
        const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('wallet_address', address.toLowerCase())
            .single();

        let user;

        if (existingUser) {
            // Update existing user's last login and base name if provided
            const { data: updatedUser, error } = await supabaseAdmin
                .from('users')
                .update({ 
                    last_login_at: new Date().toISOString(),
                    base_name: baseName || existingUser.base_name
                })
                .eq('id', existingUser.id)
                .select()
                .single();

            if (error) {
                console.error('User update error:', error);
                return NextResponse.json(
                    { message: 'Failed to update user' },
                    { status: 500 }
                );
            }

            user = updatedUser;
        } else {
            // Create new user
            const { data: newUser, error } = await supabaseAdmin
                .from('users')
                .insert({
                    wallet_address: address.toLowerCase(),
                    auth_method: 'base',
                    name: baseName || `User ${address.slice(-4)}`,
                    base_name: baseName,
                    last_login_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                console.error('User creation error:', error);
                return NextResponse.json(
                    { message: 'Failed to create user' },
                    { status: 500 }
                );
            }

            user = newUser;
        }

        // Return the user data (excluding sensitive information)
        return NextResponse.json({
            id: user.id,
            walletAddress: user.wallet_address,
            baseName: user.base_name,
            name: user.name,
            image: user.image,
            authMethod: user.auth_method,
            createdAt: user.created_at,
        });

    } catch (error) {
        console.error('Base authentication error:', error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Authentication failed' },
            { status: 500 }
        );
    }
}
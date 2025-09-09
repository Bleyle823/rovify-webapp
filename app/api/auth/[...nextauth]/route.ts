import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { ethers } from 'ethers';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', credentials.email)
            .single();

          if (error || !user) {
            return null;
          }

          // Verify password
          if (!user.password_hash) {
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, user.password_hash);
          if (!isValid) {
            return null;
          }

          // Update last login
          await supabaseAdmin
            .from('users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', user.id);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    }),
    CredentialsProvider({
      id: 'wallet',
      name: 'Wallet',
      credentials: {
        address: { label: "Address", type: "text" },
        signature: { label: "Signature", type: "text" },
        message: { label: "Message", type: "text" },
        baseName: { label: "Base Name", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.address || !credentials?.signature || !credentials?.message) {
          return null;
        }

        try {
          // Verify the signature
          const recoveredAddress = ethers.verifyMessage(credentials.message, credentials.signature);

          if (recoveredAddress.toLowerCase() !== credentials.address.toLowerCase()) {
            return null;
          }

          // Check if user exists
          const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('wallet_address', credentials.address.toLowerCase())
            .single();

          let user;
          
          if (existingUser) {
            // Update existing user
            const { data: updatedUser } = await supabaseAdmin
              .from('users')
              .update({ 
                last_login_at: new Date().toISOString(),
                base_name: credentials.baseName || existingUser.base_name
              })
              .eq('id', existingUser.id)
              .select()
              .single();
            
            user = updatedUser;
          } else {
            // Create new user
            const { data: newUser } = await supabaseAdmin
              .from('users')
              .insert({
                wallet_address: credentials.address.toLowerCase(),
                auth_method: 'base',
                name: credentials.baseName || `User ${credentials.address.slice(-4)}`,
                base_name: credentials.baseName,
                last_login_at: new Date().toISOString()
              })
              .select()
              .single();
            
            user = newUser;
          }

          if (!user) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name || user.base_name || `User ${credentials.address.slice(-4)}`,
            image: user.image,
            walletAddress: user.wallet_address,
            baseName: user.base_name,
          };
        } catch (error) {
          console.error('Wallet auth error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.walletAddress = (user as any).walletAddress;
        token.baseName = (user as any).baseName;
      }

      if (account?.provider === "google") {
        try {
          // Upsert user in database
          const { data } = await supabaseAdmin
            .from('users')
            .upsert({
              email: user.email!,
              name: user.name!,
              image: user.image,
              auth_method: 'google',
              email_verified: true,
              last_login_at: new Date().toISOString()
            }, {
              onConflict: 'email'
            })
            .select()
            .single();

          if (data) {
            token.id = data.id;
          }
        } catch (error) {
          console.error('Google auth error:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).walletAddress = token.walletAddress as string;
        (session.user as any).baseName = token.baseName as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    signUp: '/auth/register',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

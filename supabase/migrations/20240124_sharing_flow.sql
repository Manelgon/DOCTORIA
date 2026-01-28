-- Migration: Add notifications and portfolio invitations

-- 1. Table for notifications
CREATE TABLE notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- e.g., 'portfolio_invitation'
    content JSONB NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Table for portfolio invitations
CREATE TABLE carteras_invitaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cartera_id UUID NOT NULL REFERENCES carteras(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE carteras_invitaciones ENABLE ROW LEVEL SECURITY;

-- Policies for notificaciones
CREATE POLICY "Users can view own notifications" ON notificaciones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notificaciones FOR UPDATE USING (auth.uid() = user_id);

-- Policies for carteras_invitaciones
CREATE POLICY "Users can view invitations they sent or received" ON carteras_invitaciones 
FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can update invitations they received" ON carteras_invitaciones 
FOR UPDATE USING (auth.uid() = recipient_id);

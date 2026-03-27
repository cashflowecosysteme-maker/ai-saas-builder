-- Affiliation Pro Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  referral_code TEXT UNIQUE NOT NULL DEFAULT UPPER(SUBSTRING(UUID_GENERATE_V4()::TEXT, 1, 8)),
  referred_by UUID REFERENCES users(id),
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'active', 'cancelled')),
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliates table (for 3-level commission system)
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT UUID_GENERATE_V4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES affiliates(id), -- The affiliate who referred this user
  level INTEGER DEFAULT 1 CHECK (level IN (1, 2, 3)),
  commission_rate DECIMAL(5, 2) DEFAULT 25.00, -- Percentage
  total_earnings DECIMAL(10, 2) DEFAULT 0.00,
  total_referrals INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Transactions table (sales and commissions)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT UUID_GENERATE_V4(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  commission DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  source TEXT NOT NULL, -- e.g., "systeme.io - Product Name"
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- Payouts table (affiliate withdrawals)
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT UUID_GENERATE_V4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payment_method TEXT NOT NULL, -- e.g., "paypal", "bank_transfer"
  payment_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Clicks table (track referral link clicks)
CREATE TABLE IF NOT EXISTS clicks (
  id UUID PRIMARY KEY DEFAULT UUID_GENERATE_V4(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  visitor_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  referrer_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sites table (for site builder feature)
CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT UUID_GENERATE_V4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  custom_domain TEXT UNIQUE,
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_parent_id ON affiliates(parent_id);
CREATE INDEX IF NOT EXISTS idx_transactions_affiliate_id ON transactions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_clicks_affiliate_id ON clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_sites_user_id ON sites(user_id);

-- Function to automatically create affiliate record on user signup
CREATE OR REPLACE FUNCTION create_affiliate_for_user()
RETURNS TRIGGER AS $$
DECLARE
  parent_affiliate_id UUID;
  referrer_user RECORD;
BEGIN
  -- Create affiliate record
  INSERT INTO affiliates (user_id, level, commission_rate)
  VALUES (
    NEW.id,
    1,
    25.00
  );
  
  -- If user was referred, link to parent affiliate
  IF NEW.referred_by IS NOT NULL THEN
    -- Get the affiliate record of the referrer
    SELECT id INTO parent_affiliate_id
    FROM affiliates
    WHERE user_id = NEW.referred_by;
    
    IF parent_affiliate_id IS NOT NULL THEN
      -- Update the new user's affiliate record
      UPDATE affiliates
      SET parent_id = parent_affiliate_id
      WHERE user_id = NEW.id;
      
      -- Increment referral count for parent
      UPDATE affiliates
      SET total_referrals = total_referrals + 1
      WHERE id = parent_affiliate_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create affiliate on user signup
DROP TRIGGER IF EXISTS on_user_created ON users;
CREATE TRIGGER on_user_created
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_affiliate_for_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS on_users_updated ON users;
CREATE TRIGGER on_users_updated
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS on_sites_updated ON sites;
CREATE TRIGGER on_sites_updated
  BEFORE UPDATE ON sites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

-- Users: Users can only read their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Affiliates: Users can view their own affiliate info
CREATE POLICY "Users can view own affiliate" ON affiliates
  FOR SELECT USING (auth.uid() = user_id);

-- Transactions: Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
  );

-- Payouts: Users can view and create their own payouts
CREATE POLICY "Users can view own payouts" ON payouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payouts" ON payouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Sites: Users can manage their own sites
CREATE POLICY "Users can view own sites" ON sites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create sites" ON sites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sites" ON sites
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sites" ON sites
  FOR DELETE USING (auth.uid() = user_id);

-- Insert sample data for testing (optional)
-- This creates a test user with affiliate record
-- Note: The actual user must exist in auth.users first

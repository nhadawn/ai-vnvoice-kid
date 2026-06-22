
-- ENUM types
CREATE TYPE public.part_of_speech AS ENUM ('noun', 'verb', 'adjective', 'phrase', 'pronoun');
CREATE TYPE public.scaffold_level AS ENUM ('level_1', 'level_2', 'level_3', 'level_4');

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_profile_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own_profile_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own_profile_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- children
CREATE TABLE public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_year INT,
  current_level public.scaffold_level NOT NULL DEFAULT 'level_1',
  voice_preference TEXT NOT NULL DEFAULT 'female',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.children TO authenticated;
GRANT ALL ON public.children TO service_role;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
CREATE POLICY "children_own" ON public.children FOR ALL USING (auth.uid() = parent_id) WITH CHECK (auth.uid() = parent_id);

-- categories (per child, plus seeded defaults via parent_id NULL? — keep simple: each child gets own categories on create)
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_via_child" ON public.categories FOR ALL
  USING (EXISTS (SELECT 1 FROM public.children c WHERE c.id = child_id AND c.parent_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.children c WHERE c.id = child_id AND c.parent_id = auth.uid()));

-- cards
CREATE TABLE public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  label TEXT NOT NULL,
  image_url TEXT,
  emoji TEXT,
  part_of_speech public.part_of_speech NOT NULL DEFAULT 'noun',
  context_tags TEXT[] DEFAULT '{}',  -- e.g. ['morning','meal']
  use_count INT NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX cards_child_idx ON public.cards(child_id);
CREATE INDEX cards_category_idx ON public.cards(category_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cards TO authenticated;
GRANT ALL ON public.cards TO service_role;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cards_via_child" ON public.cards FOR ALL
  USING (EXISTS (SELECT 1 FROM public.children c WHERE c.id = child_id AND c.parent_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.children c WHERE c.id = child_id AND c.parent_id = auth.uid()));

-- interactions (every tap)
CREATE TABLE public.interactions (
  id BIGSERIAL PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  card_id UUID REFERENCES public.cards(id) ON DELETE SET NULL,
  label TEXT NOT NULL,
  part_of_speech public.part_of_speech,
  hour_of_day SMALLINT NOT NULL,
  was_suggested BOOLEAN NOT NULL DEFAULT false,
  suggestion_accepted BOOLEAN,
  utterance_id UUID,
  position_in_utterance INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX interactions_child_time ON public.interactions(child_id, created_at DESC);
CREATE INDEX interactions_utt ON public.interactions(utterance_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interactions TO authenticated;
GRANT ALL ON public.interactions TO service_role;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "interactions_via_child" ON public.interactions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.children c WHERE c.id = child_id AND c.parent_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.children c WHERE c.id = child_id AND c.parent_id = auth.uid()));

-- utterances (composed sentences) - used for MLU
CREATE TABLE public.utterances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  word_count INT NOT NULL,
  level public.scaffold_level NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX utterances_child_time ON public.utterances(child_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.utterances TO authenticated;
GRANT ALL ON public.utterances TO service_role;
ALTER TABLE public.utterances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "utterances_via_child" ON public.utterances FOR ALL
  USING (EXISTS (SELECT 1 FROM public.children c WHERE c.id = child_id AND c.parent_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.children c WHERE c.id = child_id AND c.parent_id = auth.uid()));

-- scaffold_state per card per child
CREATE TABLE public.scaffold_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  level public.scaffold_level NOT NULL DEFAULT 'level_1',
  uses_at_current_level INT NOT NULL DEFAULT 0,
  failed_suggestions INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(child_id, card_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scaffold_state TO authenticated;
GRANT ALL ON public.scaffold_state TO service_role;
ALTER TABLE public.scaffold_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scaffold_via_child" ON public.scaffold_state FOR ALL
  USING (EXISTS (SELECT 1 FROM public.children c WHERE c.id = child_id AND c.parent_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.children c WHERE c.id = child_id AND c.parent_id = auth.uid()));

-- Profile auto-create on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- When a child is created, seed default categories
CREATE OR REPLACE FUNCTION public.seed_default_categories()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.categories (child_id, name, icon, color, sort_order) VALUES
    (NEW.id, 'Đồ ăn', '🍎', '#FF6B6B', 1),
    (NEW.id, 'Đồ uống', '🥛', '#4ECDC4', 2),
    (NEW.id, 'Hành động', '🏃', '#FFE66D', 3),
    (NEW.id, 'Cảm xúc', '😊', '#F38181', 4),
    (NEW.id, 'Đồ chơi', '🧸', '#AA96DA', 5),
    (NEW.id, 'Người thân', '👨‍👩‍👧', '#FCBAD3', 6),
    (NEW.id, 'Nơi chốn', '🏠', '#A8E6CF', 7),
    (NEW.id, 'Cụm chức năng', '💬', '#95A5FF', 8);

  -- Seed starter cards
  INSERT INTO public.cards (child_id, category_id, label, emoji, part_of_speech, context_tags)
  SELECT NEW.id, c.id, v.label, v.emoji, v.pos::part_of_speech, v.tags
  FROM public.categories c
  JOIN (VALUES
    ('Đồ ăn', 'Cơm', '🍚', 'noun', ARRAY['meal']),
    ('Đồ ăn', 'Bánh', '🍞', 'noun', ARRAY['meal']),
    ('Đồ ăn', 'Táo', '🍎', 'noun', ARRAY[]::text[]),
    ('Đồ ăn', 'Chuối', '🍌', 'noun', ARRAY[]::text[]),
    ('Đồ uống', 'Sữa', '🥛', 'noun', ARRAY['morning']),
    ('Đồ uống', 'Nước', '💧', 'noun', ARRAY[]::text[]),
    ('Hành động', 'Ăn', '🍽️', 'verb', ARRAY['meal']),
    ('Hành động', 'Uống', '🥤', 'verb', ARRAY[]::text[]),
    ('Hành động', 'Ngủ', '😴', 'verb', ARRAY['evening']),
    ('Hành động', 'Chơi', '🎮', 'verb', ARRAY[]::text[]),
    ('Hành động', 'Tắm', '🛁', 'verb', ARRAY['evening']),
    ('Cảm xúc', 'Vui', '😄', 'adjective', ARRAY[]::text[]),
    ('Cảm xúc', 'Buồn', '😢', 'adjective', ARRAY[]::text[]),
    ('Cảm xúc', 'Đau', '🤕', 'adjective', ARRAY[]::text[]),
    ('Cảm xúc', 'Sợ', '😨', 'adjective', ARRAY[]::text[]),
    ('Đồ chơi', 'Gấu bông', '🧸', 'noun', ARRAY[]::text[]),
    ('Đồ chơi', 'Xe', '🚗', 'noun', ARRAY[]::text[]),
    ('Đồ chơi', 'Bóng', '⚽', 'noun', ARRAY[]::text[]),
    ('Người thân', 'Mẹ', '👩', 'noun', ARRAY[]::text[]),
    ('Người thân', 'Bố', '👨', 'noun', ARRAY[]::text[]),
    ('Người thân', 'Bà', '👵', 'noun', ARRAY[]::text[]),
    ('Nơi chốn', 'Nhà', '🏠', 'noun', ARRAY[]::text[]),
    ('Nơi chốn', 'Trường', '🏫', 'noun', ARRAY[]::text[]),
    ('Cụm chức năng', 'Con muốn', '🙋', 'phrase', ARRAY[]::text[]),
    ('Cụm chức năng', 'Cảm ơn', '🙏', 'phrase', ARRAY[]::text[]),
    ('Cụm chức năng', 'Xong rồi', '✅', 'phrase', ARRAY[]::text[]),
    ('Cụm chức năng', 'Không', '🙅', 'phrase', ARRAY[]::text[]),
    ('Cụm chức năng', 'Có', '👍', 'phrase', ARRAY[]::text[])
  ) AS v(cat_name, label, emoji, pos, tags) ON v.cat_name = c.name
  WHERE c.child_id = NEW.id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_child_created
AFTER INSERT ON public.children
FOR EACH ROW EXECUTE FUNCTION public.seed_default_categories();

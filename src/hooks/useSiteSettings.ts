import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SiteSettings {
  logo_url: string | null;
  site_name: string;
}

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>({
    logo_url: null,
    site_name: 'Escola Segura Report',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('logo_url, site_name')
          .eq('id', 'global')
          .maybeSingle();

        if (data) {
          setSettings({
            logo_url: data.logo_url,
            site_name: data.site_name || 'Escola Segura Report',
          });
        }
      } catch (err) {
        console.error('Error fetching site settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();

    // Set up realtime subscription
    const channel = supabase
      .channel('public:site_settings')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'site_settings', filter: 'id=eq.global' },
        (payload) => {
          setSettings({
            logo_url: payload.new.logo_url,
            site_name: payload.new.site_name || 'Escola Segura Report',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { settings, loading };
};

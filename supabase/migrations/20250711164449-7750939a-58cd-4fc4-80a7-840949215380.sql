-- Create table for Craigslist areas/cities data
CREATE TABLE public.craigslist_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  area_code TEXT NOT NULL UNIQUE,
  city_name TEXT NOT NULL,
  state_code TEXT,
  country_code TEXT DEFAULT 'US',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  timezone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.craigslist_areas ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Craigslist areas are viewable by everyone" 
ON public.craigslist_areas 
FOR SELECT 
USING (true);

-- Create policy for system updates (admin only)
CREATE POLICY "System can manage craigslist areas" 
ON public.craigslist_areas 
FOR ALL 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_craigslist_areas_area_code ON public.craigslist_areas(area_code);
CREATE INDEX idx_craigslist_areas_active ON public.craigslist_areas(is_active);
CREATE INDEX idx_craigslist_areas_state ON public.craigslist_areas(state_code);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_craigslist_areas_updated_at
BEFORE UPDATE ON public.craigslist_areas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert comprehensive list of major US Craigslist areas
INSERT INTO public.craigslist_areas (area_code, city_name, state_code, latitude, longitude) VALUES
-- Major metros
('newyork', 'New York', 'NY', 40.7128, -74.0060),
('losangeles', 'Los Angeles', 'CA', 34.0522, -118.2437),
('chicago', 'Chicago', 'IL', 41.8781, -87.6298),
('miami', 'Miami', 'FL', 25.7617, -80.1918),
('philadelphia', 'Philadelphia', 'PA', 39.9526, -75.1652),
('houston', 'Houston', 'TX', 29.7604, -95.3698),
('phoenix', 'Phoenix', 'AZ', 33.4484, -112.0740),
('dallas', 'Dallas', 'TX', 32.7767, -96.7970),
('denver', 'Denver', 'CO', 39.7392, -104.9903),
('seattle', 'Seattle', 'WA', 47.6062, -122.3321),
('sfbay', 'San Francisco Bay Area', 'CA', 37.7749, -122.4194),
('boston', 'Boston', 'MA', 42.3601, -71.0589),
('washingtondc', 'Washington DC', 'DC', 38.9072, -77.0369),
('atlanta', 'Atlanta', 'GA', 33.7490, -84.3880),
('detroit', 'Detroit', 'MI', 42.3314, -83.0458),
('minneapolis', 'Minneapolis', 'MN', 44.9778, -93.2650),
('tampa', 'Tampa', 'FL', 27.9506, -82.4572),
('denver', 'Denver', 'CO', 39.7392, -104.9903),
('portland', 'Portland', 'OR', 45.5152, -122.6784),
('lasvegas', 'Las Vegas', 'NV', 36.1699, -115.1398),
('sandiego', 'San Diego', 'CA', 32.7157, -117.1611),
('sacramento', 'Sacramento', 'CA', 38.5816, -121.4944),
('austin', 'Austin', 'TX', 30.2672, -97.7431),
('baltimore', 'Baltimore', 'MD', 39.2904, -76.6122),
('charlotte', 'Charlotte', 'NC', 35.2271, -80.8431),
('columbus', 'Columbus', 'OH', 39.9612, -82.9988),
('indianapolis', 'Indianapolis', 'IN', 39.7684, -86.1581),
('milwaukee', 'Milwaukee', 'WI', 43.0389, -87.9065),
('oklahomacity', 'Oklahoma City', 'OK', 35.4676, -97.5164),
('memphis', 'Memphis', 'TN', 35.1495, -90.0490),
('louisville', 'Louisville', 'KY', 38.2527, -85.7585),
('richmond', 'Richmond', 'VA', 37.5407, -77.4360),
('neworleans', 'New Orleans', 'LA', 29.9511, -90.0715),
('raleigh', 'Raleigh', 'NC', 35.7796, -78.6382),
('jacksonville', 'Jacksonville', 'FL', 30.3322, -81.6557),
('nashville', 'Nashville', 'TN', 36.1627, -86.7816),
('tucson', 'Tucson', 'AZ', 32.2226, -110.9747),
('fresno', 'Fresno', 'CA', 36.7378, -119.7871),
('albuquerque', 'Albuquerque', 'NM', 35.0844, -106.6504),
('kansascity', 'Kansas City', 'MO', 39.0997, -94.5786),
('omaha', 'Omaha', 'NE', 41.2524, -95.9980),
('tulsa', 'Tulsa', 'OK', 36.1540, -95.9928),
('cleveland', 'Cleveland', 'OH', 41.4993, -81.6944),
('pittsburgh', 'Pittsburgh', 'PA', 40.4406, -79.9959),
('cincinnati', 'Cincinnati', 'OH', 39.1031, -84.5120),
('stlouis', 'St. Louis', 'MO', 38.6270, -90.1994),
('buffalo', 'Buffalo', 'NY', 42.8864, -78.8784),
('rochester', 'Rochester', 'NY', 43.1566, -77.6088),
('albany', 'Albany', 'NY', 42.6526, -73.7562),
('syracuse', 'Syracuse', 'NY', 43.0481, -76.1474),
('hartford', 'Hartford', 'CT', 41.7658, -72.6734),
('providence', 'Providence', 'RI', 41.8240, -71.4128),
('worcester', 'Worcester', 'MA', 42.2626, -71.8023),
('springfield', 'Springfield', 'MA', 42.1015, -72.5898),
('newhaven', 'New Haven', 'CT', 41.3083, -72.9279),
('bridgeport', 'Bridgeport', 'CT', 41.1865, -73.1952),
('scranton', 'Scranton', 'PA', 41.4090, -75.6624),
('reading', 'Reading', 'PA', 40.3356, -75.9269),
-- More regional areas can be added as needed
('spokane', 'Spokane', 'WA', 47.6587, -117.4260),
('boise', 'Boise', 'ID', 43.6150, -116.2023),
('saltlakecity', 'Salt Lake City', 'UT', 40.7608, -111.8910),
('reno', 'Reno', 'NV', 39.5296, -119.8138),
('bakersfield', 'Bakersfield', 'CA', 35.3733, -119.0187),
('stockton', 'Stockton', 'CA', 37.9577, -121.2908),
('modesto', 'Modesto', 'CA', 37.6391, -120.9969),
('redding', 'Redding', 'CA', 40.5865, -122.3917),
('chico', 'Chico', 'CA', 39.7285, -121.8375),
('visalia', 'Visalia', 'CA', 36.3302, -119.2921);
export interface WorldShipperCompany {
  id: string;
  name: string;
  region: 'europe' | 'north-america' | 'asia' | 'africa' | 'south-america' | 'global';
  industry: string;
  rating: number; // 1-100
  preferredCargoTypes: string[];
}

export const WORLD_SHIPPER_COMPANIES: WorldShipperCompany[] = [
  // --- EUROPE (~30 companies) ---
  { id: 'eu-dhl', name: 'DHL Freight Europe', region: 'europe', industry: 'Express & Road Freight', rating: 95, preferredCargoTypes: ['High-Value Consumer Electronics', 'Retail Apparel & Designer Textiles', 'Fresh Agricultural Produce & Berries'] },
  { id: 'eu-dsv', name: 'DSV Panalpina', region: 'europe', industry: 'Transport & Logistics', rating: 92, preferredCargoTypes: ['Structural Steel Coils & Beams', 'Modular Construction Machinery', 'Class 3 Flammable Industrial Solvents'] },
  { id: 'eu-kuehne', name: 'Kuehne+Nagel', region: 'europe', industry: 'Global Freight Forwarding', rating: 96, preferredCargoTypes: ['Class 3 Flammable Industrial Solvents', 'Refined Diesel & Aviation Jet A-1 Fuel', 'Electrical Substation Power Transformer'] },
  { id: 'eu-db', name: 'DB Schenker', region: 'europe', industry: 'European Land Transport', rating: 90, preferredCargoTypes: ['Retail Apparel & Designer Textiles', 'High-Value Consumer Electronics', 'Frozen Pharmaceuticals & Vaccines'] },
  { id: 'eu-dachser', name: 'Dachser SE', region: 'europe', industry: 'European Logistics Network', rating: 91, preferredCargoTypes: ['High-Value Consumer Electronics', 'Fresh Agricultural Produce & Berries'] },
  { id: 'eu-maersk', name: 'Maersk Logistics Europe', region: 'europe', industry: 'Containerized Supply Chain', rating: 97, preferredCargoTypes: ['High-Value Consumer Electronics', 'Fresh Agricultural Produce & Berries', 'Frozen Pharmaceuticals & Vaccines'] },
  { id: 'eu-geodis', name: 'GEODIS France', region: 'europe', industry: 'Freight Management & Contract Logistics', rating: 89, preferredCargoTypes: ['Retail Apparel & Designer Textiles', 'Modular Construction Machinery'] },
  { id: 'eu-sinotrans', name: 'Sinotrans Europe', region: 'europe', industry: 'Trans-Eurasian Logistics', rating: 88, preferredCargoTypes: ['High-Value Consumer Electronics', 'Structural Steel Coils & Beams'] },
  { id: 'eu-hellmann', name: 'Hellmann Worldwide Logistics', region: 'europe', industry: 'Road & Air Freight', rating: 90, preferredCargoTypes: ['Frozen Pharmaceuticals & Vaccines', 'High-Value Consumer Electronics'] },
  { id: 'eu-bollore', name: 'Bolloré Logistics Europe', region: 'europe', industry: 'Industrial Supply Chain', rating: 89, preferredCargoTypes: ['Structural Steel Coils & Beams', 'Class 3 Flammable Industrial Solvents'] },
  { id: 'eu-panalpina', name: 'Panalpina EuroFreight', region: 'europe', industry: 'Intercontinental Air & Ocean', rating: 91, preferredCargoTypes: ['High-Value Consumer Electronics', 'Frozen Pharmaceuticals & Vaccines'] },
  { id: 'eu-dsb', name: 'DSV Road AS', region: 'europe', industry: 'Full & Part Load Road Haulage', rating: 88, preferredCargoTypes: ['Bulk Agricultural Grain & Feed', 'Structural Steel Coils & Beams'] },
  { id: 'eu-cargo-speed', name: 'CargoSpeed Express UK', region: 'europe', industry: 'Cross-Channel Express Freight', rating: 87, preferredCargoTypes: ['Retail Apparel & Designer Textiles', 'High-Value Consumer Electronics'] },
  { id: 'eu-rhenus', name: 'Rhenus Logistics', region: 'europe', industry: 'Port Logistics & Warehousing', rating: 90, preferredCargoTypes: ['Modular Construction Machinery', 'Structural Steel Coils & Beams'] },
  { id: 'eu-nacco', name: 'NACCO Bulk Transports', region: 'europe', industry: 'Bulk & Industrial Freight', rating: 86, preferredCargoTypes: ['Bulk Agricultural Grain & Feed', 'Refined Diesel & Aviation Jet A-1 Fuel'] },
  { id: 'eu-schaefer', name: 'Schaefer Freight Systems', region: 'europe', industry: 'Automotive & Heavy Industry Supply', rating: 92, preferredCargoTypes: ['Modular Construction Machinery', 'Structural Steel Coils & Beams'] },
  { id: 'eu-freight-line', name: 'Nordic Freight Line', region: 'europe', industry: 'Scandinavia Cold Chain', rating: 93, preferredCargoTypes: ['Fresh Agricultural Produce & Berries', 'Frozen Pharmaceuticals & Vaccines'] },
  { id: 'eu-alps-trans', name: 'Alps Trans Logistics', region: 'europe', industry: 'Alpine Heavy Haulage', rating: 91, preferredCargoTypes: ['Electrical Substation Power Transformer', 'Modular Construction Machinery'] },
  { id: 'eu-iberia-cargo', name: 'Iberia TransCargo', region: 'europe', industry: 'Iberian Agricultural Transport', rating: 89, preferredCargoTypes: ['Fresh Agricultural Produce & Berries', 'Retail Apparel & Designer Textiles'] },
  { id: 'eu-danubia', name: 'Danubia Freight Express', region: 'europe', industry: 'Central European Corridor Freight', rating: 88, preferredCargoTypes: ['Bulk Agricultural Grain & Feed', 'Retail Apparel & Designer Textiles'] },
  { id: 'eu-baltic-link', name: 'Baltic Link Transport', region: 'europe', industry: 'Baltic Sea Highway Logistics', rating: 87, preferredCargoTypes: ['Structural Steel Coils & Beams', 'High-Value Consumer Electronics'] },
  { id: 'eu-rhine-cargo', name: 'Rhine Valley Cargo', region: 'europe', industry: 'Industrial River-Road Logistics', rating: 90, preferredCargoTypes: ['Class 3 Flammable Industrial Solvents', 'Refined Diesel & Aviation Jet A-1 Fuel'] },
  { id: 'eu-cargotec', name: 'Cargotec Freight Solutions', region: 'europe', industry: 'Heavy Machinery Freight', rating: 92, preferredCargoTypes: ['Electrical Substation Power Transformer', 'Modular Construction Machinery'] },
  { id: 'eu-trans-med', name: 'Trans-Mediterranean Haulage', region: 'europe', industry: 'Southern EU Produce Distribution', rating: 88, preferredCargoTypes: ['Fresh Agricultural Produce & Berries', 'Retail Apparel & Designer Textiles'] },
  { id: 'eu-cargolux', name: 'Cargolux Surface Link', region: 'europe', industry: 'Aviation Feeder Trucking', rating: 94, preferredCargoTypes: ['High-Value Consumer Electronics', 'Frozen Pharmaceuticals & Vaccines'] },
  { id: 'eu-euro-express', name: 'EuroExpress Pallet Network', region: 'europe', industry: 'Palletized Distribution', rating: 89, preferredCargoTypes: ['Retail Apparel & Designer Textiles', 'High-Value Consumer Electronics'] },
  { id: 'eu-polaris', name: 'Polaris Cold Chain EU', region: 'europe', industry: 'Temperature-Controlled Logistics', rating: 93, preferredCargoTypes: ['Frozen Pharmaceuticals & Vaccines', 'Fresh Agricultural Produce & Berries'] },
  { id: 'eu-vanguard', name: 'Vanguard Transports BV', region: 'europe', industry: 'Port Terminal Haulage', rating: 91, preferredCargoTypes: ['High-Value Consumer Electronics', 'Structural Steel Coils & Beams'] },
  { id: 'eu-benelux', name: 'Benelux Freight Solutions', region: 'europe', industry: 'Western European Hub Logistics', rating: 90, preferredCargoTypes: ['Retail Apparel & Designer Textiles', 'Fresh Agricultural Produce & Berries'] },
  { id: 'eu-apex', name: 'Apex Continental Freight', region: 'europe', industry: 'Pan-European Full Truckload', rating: 91, preferredCargoTypes: ['Class 3 Flammable Industrial Solvents', 'Modular Construction Machinery'] },

  // --- NORTH AMERICA (~30 companies) ---
  { id: 'na-fedex', name: 'FedEx Freight North America', region: 'north-america', industry: 'LTL & Truckload Freight', rating: 94, preferredCargoTypes: ['High-Value Consumer Electronics', 'Retail Apparel & Designer Textiles'] },
  { id: 'na-xpo', name: 'XPO Logistics NA', region: 'north-america', industry: 'Less-Than-Truckload & Brokerage', rating: 91, preferredCargoTypes: ['Structural Steel Coils & Beams', 'High-Value Consumer Electronics', 'Electrical Substation Power Transformer'] },
  { id: 'na-schneider', name: 'Schneider National', region: 'north-america', industry: 'Intermodal & Van Truckload', rating: 93, preferredCargoTypes: ['Retail Apparel & Designer Textiles', 'Frozen Pharmaceuticals & Vaccines', 'Bulk Agricultural Grain & Feed'] },
  { id: 'na-jbhunt', name: 'J.B. Hunt Transport Services', region: 'north-america', industry: 'Dedicated Contract Services', rating: 95, preferredCargoTypes: ['Fresh Agricultural Produce & Berries', 'High-Value Consumer Electronics', 'Class 3 Flammable Industrial Solvents'] },
  { id: 'na-amazon', name: 'Amazon Freight Partner NA', region: 'north-america', industry: 'E-Commerce Fulfillment Logistics', rating: 96, preferredCargoTypes: ['High-Value Consumer Electronics', 'Retail Apparel & Designer Textiles'] },
  { id: 'na-swift', name: 'Swift Transportation', region: 'north-america', industry: 'General Dry Van & Reefer', rating: 89, preferredCargoTypes: ['Retail Apparel & Designer Textiles', 'Fresh Agricultural Produce & Berries', 'Bulk Agricultural Grain & Feed'] },
  { id: 'na-old-dominion', name: 'Old Dominion Freight Line', region: 'north-america', industry: 'Premium LTL Carrier', rating: 97, preferredCargoTypes: ['High-Value Consumer Electronics', 'Frozen Pharmaceuticals & Vaccines'] },
  { id: 'na-saia', name: 'Saia Inc. Freight', region: 'north-america', industry: 'Multi-Regional LTL Carrier', rating: 90, preferredCargoTypes: ['Retail Apparel & Designer Textiles', 'Modular Construction Machinery'] },
  { id: 'na-werner', name: 'Werner Enterprises', region: 'north-america', industry: 'Truckload & Logistics Services', rating: 91, preferredCargoTypes: ['Fresh Agricultural Produce & Berries', 'High-Value Consumer Electronics'] },
  { id: 'na-knight', name: 'Knight-Swift Transportation', region: 'north-america', industry: 'Full Truckload Carrier', rating: 92, preferredCargoTypes: ['Structural Steel Coils & Beams', 'Retail Apparel & Designer Textiles'] },
  { id: 'na-landstar', name: 'Landstar System', region: 'north-america', industry: 'Specialized Heavy Haul & Van', rating: 93, preferredCargoTypes: ['Electrical Substation Power Transformer', 'Modular Construction Machinery', 'Structural Steel Coils & Beams'] },
  { id: 'na-prime', name: 'Prime Inc. Refrigerated', region: 'north-america', industry: 'Reefer & Flatbed Specialist', rating: 94, preferredCargoTypes: ['Fresh Agricultural Produce & Berries', 'Frozen Pharmaceuticals & Vaccines'] },
  { id: 'na-heartland', name: 'Heartland Express', region: 'north-america', industry: 'Short-to-Medium Haul Dry Van', rating: 90, preferredCargoTypes: ['Retail Apparel & Designer Textiles', 'High-Value Consumer Electronics'] },
  { id: 'na-covenant', name: 'Covenant Logistics', region: 'north-america', industry: 'Expedited Team Truckload', rating: 89, preferredCargoTypes: ['High-Value Consumer Electronics', 'Frozen Pharmaceuticals & Vaccines'] },
  { id: 'na-marten', name: 'Marten Transport', region: 'north-america', industry: 'Temperature-Controlled Truckload', rating: 92, preferredCargoTypes: ['Fresh Agricultural Produce & Berries', 'Frozen Pharmaceuticals & Vaccines'] },
  { id: 'na-us-xpress', name: 'U.S. Xpress Enterprises', region: 'north-america', industry: 'Digital Fleet Solutions', rating: 88, preferredCargoTypes: ['Retail Apparel & Designer Textiles', 'High-Value Consumer Electronics'] },
  { id: 'na-cr-england', name: 'C.R. England Refrigerated', region: 'north-america', industry: 'National Cold Chain Transport', rating: 91, preferredCargoTypes: ['Fresh Agricultural Produce & Berries', 'Frozen Pharmaceuticals & Vaccines'] },
  { id: 'na-hub-group', name: 'Hub Group Intermodal', region: 'north-america', industry: 'Intermodal & Logistics Management', rating: 93, preferredCargoTypes: ['Bulk Agricultural Grain & Feed', 'Structural Steel Coils & Beams'] },
  { id: 'na-bnsf-log', name: 'BNSF Logistics', region: 'north-america', industry: 'Rail-Road Multimodal Freight', rating: 94, preferredCargoTypes: ['Structural Steel Coils & Beams', 'Modular Construction Machinery'] },
  { id: 'na-ryder', name: 'Ryder Dedicated Transportation', region: 'north-america', industry: 'Dedicated Fleet Outsourcing', rating: 92, preferredCargoTypes: ['Modular Construction Machinery', 'Refined Diesel & Aviation Jet A-1 Fuel'] },
  { id: 'na-penske', name: 'Penske Logistics NA', region: 'north-america', industry: 'Supply Chain Management', rating: 95, preferredCargoTypes: ['High-Value Consumer Electronics', 'Retail Apparel & Designer Textiles'] },
  { id: 'na-crst', name: 'CRST The Transportation Solution', region: 'north-america', industry: 'Specialized & Team Freight', rating: 89, preferredCargoTypes: ['High-Value Consumer Electronics', 'Modular Construction Machinery'] },
  { id: 'na-andrus', name: 'Andrus Transportation', region: 'north-america', industry: 'Western US Regional Truckload', rating: 87, preferredCargoTypes: ['Fresh Agricultural Produce & Berries', 'Bulk Agricultural Grain & Feed'] },
  { id: 'na-coyote', name: 'Coyote Logistics', region: 'north-america', industry: 'Freight Brokerage & 3PL', rating: 90, preferredCargoTypes: ['Retail Apparel & Designer Textiles', 'Structural Steel Coils & Beams'] },
  { id: 'na-ArcBest', name: 'ArcBest Corporation', region: 'north-america', industry: 'Comprehensive Logistics & LTL', rating: 91, preferredCargoTypes: ['Modular Construction Machinery', 'High-Value Consumer Electronics'] },
  { id: 'na-aggregate', name: 'Aggregate Industries Haulage', region: 'north-america', industry: 'Bulk & Construction Materials', rating: 86, preferredCargoTypes: ['Structural Steel Coils & Beams', 'Bulk Agricultural Grain & Feed'] },
  { id: 'na-pan-american', name: 'Pan-American Highway Freight', region: 'north-america', industry: 'Cross-Border US-Canada-Mexico', rating: 92, preferredCargoTypes: ['Modular Construction Machinery', 'Automotive Components'] },
  { id: 'na-transforce', name: 'TFI International (TransForce)', region: 'north-america', industry: 'North American Package & Truckload', rating: 93, preferredCargoTypes: ['Retail Apparel & Designer Textiles', 'High-Value Consumer Electronics'] },
  { id: 'na-dayton', name: 'Dayton Freight Lines', region: 'north-america', industry: 'Midwestern Regional LTL', rating: 90, preferredCargoTypes: ['Retail Apparel & Designer Textiles', 'Modular Construction Machinery'] },
  { id: 'na-western-express', name: 'Western Express', region: 'north-america', industry: 'Flatbed & Van Freight', rating: 87, preferredCargoTypes: ['Structural Steel Coils & Beams', 'Retail Apparel & Designer Textiles'] },

  // --- ASIA (~30 companies) ---
  { id: 'as-sinotrans', name: 'Sinotrans Limited', region: 'asia', industry: 'Chinese State Logistics & Shipping', rating: 96, preferredCargoTypes: ['High-Value Consumer Electronics', 'Retail Apparel & Designer Textiles', 'Structural Steel Coils & Beams'] },
  { id: 'as-Nippon-express', name: 'Nippon Express (Nittsu)', region: 'asia', industry: 'Global Japanese Logistics', rating: 97, preferredCargoTypes: ['High-Value Consumer Electronics', 'Frozen Pharmaceuticals & Vaccines'] },
  { id: 'as-yamato', name: 'Yamato Transport (Black Cat)', region: 'asia', industry: 'Express Parcel & Road Freight', rating: 95, preferredCargoTypes: ['High-Value Consumer Electronics', 'Retail Apparel & Designer Textiles'] },
  { id: 'as-sagawa', name: 'Sagawa Express', region: 'asia', industry: 'Japanese Road Express', rating: 94, preferredCargoTypes: ['Retail Apparel & Designer Textiles', 'High-Value Consumer Electronics'] },
  { id: 'as-cj-logistics', name: 'CJ Logistics South Korea', region: 'asia', industry: 'Contract Logistics & Parcel', rating: 92, preferredCargoTypes: ['High-Value Consumer Electronics', 'Fresh Agricultural Produce & Berries'] },
  { id: 'as-kerry', name: 'Kerry Logistics Hong Kong', region: 'asia', industry: 'Asian Network Freight Forwarding', rating: 93, preferredCargoTypes: ['Retail Apparel & Designer Textiles', 'High-Value Consumer Electronics'] },
  { id: 'as-tata', name: 'Tata NYK Logistics India', region: 'asia', industry: 'Indian Heavy Industrial Freight', rating: 91, preferredCargoTypes: ['Structural Steel Coils & Beams', 'Modular Construction Machinery', 'Electrical Substation Power Transformer'] },
  { id: 'as-maersk-asia', name: 'Maersk Supply Chain Asia', region: 'asia', industry: 'Pan-Asian Container Logistics', rating: 97, preferredCargoTypes: ['High-Value Consumer Electronics', 'Retail Apparel & Designer Textiles'] },
  { id: 'as-db-schenker-asia', name: 'DB Schenker Asia Pacific', region: 'asia', industry: 'Trans-Asian Freight Network', rating: 94, preferredCargoTypes: ['High-Value Consumer Electronics', 'Modular Construction Machinery'] },
  { id: 'as-dhl-asia', name: 'DHL Supply Chain Greater China', region: 'asia', industry: 'Contract Logistics & Express', rating: 95, preferredCargoTypes: ['High-Value Consumer Electronics', 'Frozen Pharmaceuticals & Vaccines'] },
  { id: 'as-toyota-tsusho', name: 'Toyota Tsusho Logistics', region: 'asia', industry: 'Automotive & Industrial Supply Chain', rating: 96, preferredCargoTypes: ['Modular Construction Machinery', 'Structural Steel Coils & Beams'] },
  { id: 'as-sino-thai', name: 'Sino-Thai Express Freight', region: 'asia', industry: 'ASEAN Cross-Border Transport', rating: 88, preferredCargoTypes: ['Fresh Agricultural Produce & Berries', 'Retail Apparel & Designer Textiles'] },
  { id: 'as-reliance-log', name: 'Reliance Retail Supply Chain', region: 'asia', industry: 'Indian Consumer Goods Logistics', rating: 90, preferredCargoTypes: ['Retail Apparel & Designer Textiles', 'Fresh Agricultural Produce & Berries'] },
  { id: 'as-kuehne-asia', name: 'Kuehne+Nagel Singapore', region: 'asia', industry: 'Regional Hub Forwarding', rating: 96, preferredCargoTypes: ['High-Value Consumer Electronics', 'Frozen Pharmaceuticals & Vaccines'] },
  { id: 'as-pan-asia', name: 'Pan-Asia Highway Transport', region: 'asia', industry: 'Continental Asian Highways', rating: 87, preferredCargoTypes: ['Structural Steel Coils & Beams', 'Bulk Agricultural Grain & Feed'] },
  { id: 'as-lotte', name: 'Lotte Global Logistics', region: 'asia', industry: 'Korean Cold Chain & Retail', rating: 91, preferredCargoTypes: ['Fresh Agricultural Produce & Berries', 'Frozen Pharmaceuticals & Vaccines'] },
  { id: 'as-hitchhiker', name: 'Hitchhiker Freight Singapore', region: 'asia', industry: 'Port Drayage & Container Haulage', rating: 89, preferredCargoTypes: ['High-Value Consumer Electronics', 'Structural Steel Coils & Beams'] },
  { id: 'as-adani', name: 'Adani Logistics India', region: 'asia', industry: 'Ports, Terminals & Rail-Road', rating: 93, preferredCargoTypes: ['Bulk Agricultural Grain & Feed', 'Structural Steel Coils & Beams', 'Refined Diesel & Aviation Jet A-1 Fuel'] },
  { id: 'as-jct', name: 'JCT Logistics Tokyo', region: 'asia', industry: 'Japanese Domestic Truckload', rating: 92, preferredCargoTypes: ['High-Value Consumer Electronics', 'Retail Apparel & Designer Textiles'] },
  { id: 'as-indonesia-trans', name: 'Nusantara Trans Logistik', region: 'asia', industry: 'Indonesian Archipelago Freight', rating: 86, preferredCargoTypes: ['Fresh Agricultural Produce & Berries', 'Bulk Agricultural Grain & Feed'] },
  { id: 'as-viet-trans', name: 'Vietnam National Freight', region: 'asia', industry: 'Mekong Delta Transport', rating: 87, preferredCargoTypes: ['Fresh Agricultural Produce & Berries', 'Retail Apparel & Designer Textiles'] },
  { id: 'as-malaysia-freight', name: 'Logistik Negara Malaysia', region: 'asia', industry: 'Malaysian Highway Logistics', rating: 89, preferredCargoTypes: ['High-Value Consumer Electronics', 'Structural Steel Coils & Beams'] },
  { id: 'as-gulf-apex', name: 'Gulf Apex Transport UAE', region: 'asia', industry: 'Middle East Desert Highway Freight', rating: 92, preferredCargoTypes: ['Refined Diesel & Aviation Jet A-1 Fuel', 'Class 3 Flammable Industrial Solvents', 'Electrical Substation Power Transformer'] },
  { id: 'as-emirates-log', name: 'Emirates Logistics Dubai', region: 'asia', industry: 'Middle Eastern Hub Forwarding', rating: 95, preferredCargoTypes: ['High-Value Consumer Electronics', 'Frozen Pharmaceuticals & Vaccines'] },
  { id: 'as-saudi-trans', name: 'Saudi Land Transport Co.', region: 'asia', industry: 'Petrochemical & Heavy Haul', rating: 94, preferredCargoTypes: ['Refined Diesel & Aviation Jet A-1 Fuel', 'Class 3 Flammable Industrial Solvents'] },
  { id: 'as-qatar-cargo', name: 'Qatar Airways Surface Link', region: 'asia', industry: 'Aviation Cargo Feeder', rating: 95, preferredCargoTypes: ['High-Value Consumer Electronics', 'Frozen Pharmaceuticals & Vaccines'] },
  { id: 'as-delhivery', name: 'Delhivery Supply Chain India', region: 'asia', industry: 'Tech-Enabled Indian Logistics', rating: 91, preferredCargoTypes: ['High-Value Consumer Electronics', 'Retail Apparel & Designer Textiles'] },
  { id: 'as-bluedart', name: 'Blue Dart Express India', region: 'asia', industry: 'South Asian Express Delivery', rating: 93, preferredCargoTypes: ['High-Value Consumer Electronics', 'Frozen Pharmaceuticals & Vaccines'] },
  { id: 'as-sag-cargo', name: 'Saga Transports Tokyo', region: 'asia', industry: 'Cold Chain & Frozen Logistics', rating: 92, preferredCargoTypes: ['Fresh Agricultural Produce & Berries', 'Frozen Pharmaceuticals & Vaccines'] },
  { id: 'as-zenith-asia', name: 'Zenith Pan-Asian Logistics', region: 'asia', industry: 'Cross-Border Industrial Freight', rating: 90, preferredCargoTypes: ['Structural Steel Coils & Beams', 'Modular Construction Machinery'] },

  // --- AFRICA (~30 companies) ---
  { id: 'af-transnet', name: 'Transnet Freight Rail & Road SA', region: 'africa', industry: 'South African State Logistics', rating: 91, preferredCargoTypes: ['Structural Steel Coils & Beams', 'Bulk Agricultural Grain & Feed', 'Electrical Substation Power Transformer'] },
  { id: 'af-imperial', name: 'Imperial Logistics (DP World)', region: 'africa', industry: 'African Continental Supply Chain', rating: 93, preferredCargoTypes: ['Fresh Agricultural Produce & Berries', 'Retail Apparel & Designer Textiles', 'Refined Diesel & Aviation Jet A-1 Fuel'] },
  { id: 'af-bollore', name: 'Bolloré Transport Africa', region: 'africa', industry: 'Pan-African Port & Road Logistics', rating: 92, preferredCargoTypes: ['Structural Steel Coils & Beams', 'Modular Construction Machinery'] },
  { id: 'af-barry', name: 'Barloworld Transport SA', region: 'africa', industry: 'Southern African Heavy Haul', rating: 90, preferredCargoTypes: ['Modular Construction Machinery', 'Electrical Substation Power Transformer'] },
  { id: 'af-cma-cgm', name: 'CMA CGM Logistics Africa', region: 'africa', industry: 'Port-to-Hinterland Corridors', rating: 94, preferredCargoTypes: ['High-Value Consumer Electronics', 'Fresh Agricultural Produce & Berries'] },
  { id: 'af-grindrod', name: 'Grindrod Freight Services', region: 'africa', industry: 'African Terminals & Logistics', rating: 89, preferredCargoTypes: ['Bulk Agricultural Grain & Feed', 'Structural Steel Coils & Beams'] },
  { id: 'af-danza', name: 'Danza Trans Africa', region: 'africa', industry: 'Cross-Border East African Freight', rating: 87, preferredCargoTypes: ['Retail Apparel & Designer Textiles', 'Fresh Agricultural Produce & Berries'] },
  { id: 'af-mitchell', name: 'Mitchell Cotts Freight Kenya', region: 'africa', industry: 'East African Forwarding', rating: 88, preferredCargoTypes: ['Fresh Agricultural Produce & Berries', 'High-Value Consumer Electronics'] },
  { id: 'af-scancor', name: 'Scancor Cold Chain Africa', region: 'africa', industry: 'Perishable Export Logistics', rating: 90, preferredCargoTypes: ['Fresh Agricultural Produce & Berries', 'Frozen Pharmaceuticals & Vaccines'] },
  { id: 'af-nile-trans', name: 'Nile Valley Freight Egypt', region: 'africa', industry: 'North African Corridor Haulage', rating: 89, preferredCargoTypes: ['Retail Apparel & Designer Textiles', 'Bulk Agricultural Grain & Feed'] },
  { id: 'af-maghreb', name: 'Maghreb Express Logistics', region: 'africa', industry: 'North-West African Transport', rating: 88, preferredCargoTypes: ['Fresh Agricultural Produce & Berries', 'Retail Apparel & Designer Textiles'] },
  { id: 'af-lagos-dray', name: 'Lagos Port Drayage Nigeria', region: 'africa', industry: 'West African Port Haulage', rating: 86, preferredCargoTypes: ['High-Value Consumer Electronics', 'Structural Steel Coils & Beams'] },
  { id: 'af-nigeria-trans', name: 'Nigerian National Transport', region: 'africa', industry: 'Federal Highway Freight', rating: 85, preferredCargoTypes: ['Refined Diesel & Aviation Jet A-1 Fuel', 'Bulk Agricultural Grain & Feed'] },
  { id: 'af-savannah', name: 'Savannah Express Logistics', region: 'africa', industry: 'East African Highway Transport', rating: 87, preferredCargoTypes: ['Fresh Agricultural Produce & Berries', 'Retail Apparel & Designer Textiles'] },
  { id: 'af-cape-link', name: 'Cape Town Link Logistics', region: 'africa', industry: 'South African Cold Chain', rating: 91, preferredCargoTypes: ['Fresh Agricultural Produce & Berries', 'Frozen Pharmaceuticals & Vaccines'] },
  { id: 'af-zambezi', name: 'Zambezi Transcontinental', region: 'africa', industry: 'Central African Trade Corridors', rating: 86, preferredCargoTypes: ['Modular Construction Machinery', 'Structural Steel Coils & Beams'] },
  { id: 'af-kalahari', name: 'Kalahari Bulk Freight', region: 'africa', industry: 'Mining & Mineral Logistics', rating: 88, preferredCargoTypes: ['Structural Steel Coils & Beams', 'Bulk Agricultural Grain & Feed'] },
  { id: 'af-atlas-log', name: 'Atlas Logistics Morocco', region: 'africa', industry: 'Mediterranean-African Trade Link', rating: 90, preferredCargoTypes: ['Fresh Agricultural Produce & Berries', 'Retail Apparel & Designer Textiles'] },
  { id: 'af-redsea', name: 'Red Sea Freight Services', region: 'africa', industry: 'Horn of Africa Corridor', rating: 87, preferredCargoTypes: ['Refined Diesel & Aviation Jet A-1 Fuel', 'High-Value Consumer Electronics'] },
  { id: 'af-gulf-guinea', name: 'Gulf of Guinea Express', region: 'africa', industry: 'West African Coastal Logistics', rating: 88, preferredCargoTypes: ['Class 3 Flammable Industrial Solvents', 'Modular Construction Machinery'] },
  { id: 'af-sunbelt', name: 'Sunbelt Transport SA', region: 'africa', industry: 'South African Industrial Haulage', rating: 90, preferredCargoTypes: ['Structural Steel Coils & Beams', 'Modular Construction Machinery'] },
  { id: 'af-panafrica', name: 'Pan-African Highway Cargo', region: 'africa', industry: 'Trans-African Highway Network', rating: 86, preferredCargoTypes: ['Retail Apparel & Designer Textiles', 'Bulk Agricultural Grain & Feed'] },
  { id: 'af-sahara-link', name: 'Sahara Overland Express', region: 'africa', industry: 'Trans-Sahara Freight', rating: 85, preferredCargoTypes: ['Refined Diesel & Aviation Jet A-1 Fuel', 'Modular Construction Machinery'] },
  { id: 'af-horn-log', name: 'Horn of Africa Logistics', region: 'africa', industry: 'East African Regional Freight', rating: 87, preferredCargoTypes: ['Fresh Agricultural Produce & Berries', 'Retail Apparel & Designer Textiles'] },
  { id: 'af-equator', name: 'Equatorial Freight Network', region: 'africa', industry: 'Central African Basin Haulage', rating: 85, preferredCargoTypes: ['Bulk Agricultural Grain & Feed', 'Structural Steel Coils & Beams'] },
  { id: 'af-limpopo', name: 'Limpopo Valley Transport', region: 'africa', industry: 'Cross-Border SA-Zimbabwe Freight', rating: 88, preferredCargoTypes: ['Fresh Agricultural Produce & Berries', 'Modular Construction Machinery'] },
  { id: 'af-durban-haul', name: 'Durban Container Express', region: 'africa', industry: 'Port Hinterland Logistics', rating: 92, preferredCargoTypes: ['High-Value Consumer Electronics', 'Structural Steel Coils & Beams'] },
  { id: 'af-alexandria', name: 'Alexandria Port Freight', region: 'africa', industry: 'Egyptian Port Transport', rating: 89, preferredCargoTypes: ['Retail Apparel & Designer Textiles', 'Bulk Agricultural Grain & Feed'] },
  { id: 'af-casablanca-log', name: 'Casablanca Transports', region: 'africa', industry: 'Moroccan Industrial Logistics', rating: 90, preferredCargoTypes: ['Fresh Agricultural Produce & Berries', 'High-Value Consumer Electronics'] },
  { id: 'af-zenith-africa', name: 'Zenith Continental Africa', region: 'africa', industry: 'Pan-African Heavy Cargo', rating: 89, preferredCargoTypes: ['Electrical Substation Power Transformer', 'Modular Construction Machinery'] },

  // --- SOUTH AMERICA (~30 companies) ---
  { id: 'sa-jSL', name: 'JSL S.A. Brazil', region: 'south-america', industry: 'Largest Latin American Logistics Fleet', rating: 94, preferredCargoTypes: ['Bulk Agricultural Grain & Feed', 'Structural Steel Coils & Beams', 'Modular Construction Machinery'] },
  { id: 'sa-log-in', name: 'Log-In Logística Intermodal', region: 'south-america', industry: 'Brazilian Coastal & Road Intermodal', rating: 92, preferredCargoTypes: ['High-Value Consumer Electronics', 'Retail Apparel & Designer Textiles'] },
  { id: 'sa-raizen', name: 'Raízen Combustíveis Logística', region: 'south-america', industry: 'Energy & Bulk Fuel Transport', rating: 95, preferredCargoTypes: ['Refined Diesel & Aviation Jet A-1 Fuel', 'Class 3 Flammable Industrial Solvents'] },
  { id: 'sa-ultracargo', name: 'Ultracargo Brazil', region: 'south-america', industry: 'Bulk Liquid & Chemical Terminal Logistics', rating: 93, preferredCargoTypes: ['Class 3 Flammable Industrial Solvents', 'Refined Diesel & Aviation Jet A-1 Fuel'] },
  { id: 'sa-fedex-sa', name: 'FedEx Express South America', region: 'south-america', industry: 'Express Road & Air Freight', rating: 94, preferredCargoTypes: ['High-Value Consumer Electronics', 'Frozen Pharmaceuticals & Vaccines'] },
  { id: 'sa-dhl-sa', name: 'DHL Global Forwarding SA', region: 'south-america', industry: 'Continental Freight Forwarding', rating: 95, preferredCargoTypes: ['High-Value Consumer Electronics', 'Retail Apparel & Designer Textiles'] },
  { id: 'sa-chile-trans', name: 'Transportes Transcargo Chile', region: 'south-america', industry: 'Andean Mining & Agricultural Freight', rating: 91, preferredCargoTypes: ['Structural Steel Coils & Beams', 'Fresh Agricultural Produce & Berries'] },
  { id: 'sa-argentina-cargo', name: 'Buenos Aires Cargas SA', region: 'south-america', industry: 'Argentine Agricultural Haulage', rating: 90, preferredCargoTypes: ['Bulk Agricultural Grain & Feed', 'Fresh Agricultural Produce & Berries'] },
  { id: 'sa-andean-express', name: 'Andean Express Logistics', region: 'south-america', industry: 'Cross-Cordillera Heavy Transport', rating: 89, preferredCargoTypes: ['Modular Construction Machinery', 'Electrical Substation Power Transformer'] },
  { id: 'sa-amazonas', name: 'Amazonas River-Road Logistics', region: 'south-america', industry: 'Northern Brazil Basin Freight', rating: 86, preferredCargoTypes: ['Bulk Agricultural Grain & Feed', 'Retail Apparel & Designer Textiles'] },
  { id: 'sa-mercosur', name: 'Mercosur Transload', region: 'south-america', industry: 'Cross-Border South American Trade', rating: 92, preferredCargoTypes: ['Structural Steel Coils & Beams', 'Fresh Agricultural Produce & Berries'] },
  { id: 'sa-sao-paulo-log', name: 'São Paulo Cargo Hub', region: 'south-america', industry: 'Metropolitan Distribution Logistics', rating: 91, preferredCargoTypes: ['High-Value Consumer Electronics', 'Retail Apparel & Designer Textiles'] },
  { id: 'sa-patagonia', name: 'Patagonia Freight Lines', region: 'south-america', industry: 'Southern Cone Long-Haul Transport', rating: 88, preferredCargoTypes: ['Frozen Pharmaceuticals & Vaccines', 'Fresh Agricultural Produce & Berries'] },
  { id: 'sa-colombia-trans', name: 'Transportes Gran Colombia', region: 'south-america', industry: 'Coffee & Industrial Logistics', rating: 89, preferredCargoTypes: ['Fresh Agricultural Produce & Berries', 'Retail Apparel & Designer Textiles'] },
  { id: 'sa-peru-cargo', name: 'Peruvian Andes Logistics', region: 'south-america', industry: 'Mining & Agricultural Transport', rating: 88, preferredCargoTypes: ['Structural Steel Coils & Beams', 'Modular Construction Machinery'] },
  { id: 'sa-uruguay-trans', name: 'Montevideo Cargas S.A.', region: 'south-america', industry: 'Uruguayan Port & Highway Freight', rating: 90, preferredCargoTypes: ['Bulk Agricultural Grain & Feed', 'Fresh Agricultural Produce & Berries'] },
  { id: 'sa-brazil-agro', name: 'AgroLogística do Brasil', region: 'south-america', industry: 'Massive Grain & Soybean Transport', rating: 96, preferredCargoTypes: ['Bulk Agricultural Grain & Feed', 'Fresh Agricultural Produce & Berries'] },
  { id: 'sa-rio-dray', name: 'Rio de Janeiro Container Drayage', region: 'south-america', industry: 'Port Terminal Logistics', rating: 89, preferredCargoTypes: ['High-Value Consumer Electronics', 'Structural Steel Coils & Beams'] },
  { id: 'sa-trans-chile', name: 'TransChile Express', region: 'south-america', industry: 'Central Valley Produce Logistics', rating: 92, preferredCargoTypes: ['Fresh Agricultural Produce & Berries', 'Frozen Pharmaceuticals & Vaccines'] },
  { id: 'sa-sul-logistica', name: 'Sul-Americana de Logística', region: 'south-america', industry: 'Southern Brazil Heavy Fleet', rating: 91, preferredCargoTypes: ['Structural Steel Coils & Beams', 'Bulk Agricultural Grain & Feed'] },
  { id: 'sa-nordeste', name: 'Nordeste Translog', region: 'south-america', industry: 'Northeastern Brazilian Freight', rating: 87, preferredCargoTypes: ['Retail Apparel & Designer Textiles', 'Bulk Agricultural Grain & Feed'] },
  { id: 'sa-inter-lagos', name: 'Interlagos Express Freight', region: 'south-america', industry: 'Industrial Corridor Transport', rating: 90, preferredCargoTypes: ['Modular Construction Machinery', 'High-Value Consumer Electronics'] },
  { id: 'sa-cargosul', name: 'CargoSul Transportes', region: 'south-america', industry: 'Southern Cone Heavy Transport', rating: 89, preferredCargoTypes: ['Structural Steel Coils & Beams', 'Electrical Substation Power Transformer'] },
  { id: 'sa-andes-mining', name: 'Andean Mining Supply Chain', region: 'south-america', industry: 'Specialized Mineral Haulage', rating: 93, preferredCargoTypes: ['Modular Construction Machinery', 'Structural Steel Coils & Beams'] },
  { id: 'sa-amazon-agro', name: 'Amazon Agro-Export Logistics', region: 'south-america', industry: 'Bio-Agricultural Transport', rating: 88, preferredCargoTypes: ['Fresh Agricultural Produce & Berries', 'Bulk Agricultural Grain & Feed'] },
  { id: 'sa-parana-trans', name: 'Paraná Transportes', region: 'south-america', industry: 'Grain & Timber Logistics', rating: 90, preferredCargoTypes: ['Bulk Agricultural Grain & Feed', 'Structural Steel Coils & Beams'] },
  { id: 'sa-caracas-link', name: 'Caracas-Andes Freight Link', region: 'south-america', industry: 'Northern South America Route', rating: 85, preferredCargoTypes: ['Refined Diesel & Aviation Jet A-1 Fuel', 'Retail Apparel & Designer Textiles'] },
  { id: 'sa-quito-cargo', name: 'Quito Express Logistics', region: 'south-america', industry: 'High-Altitude Andean Haulage', rating: 87, preferredCargoTypes: ['Fresh Agricultural Produce & Berries', 'Retail Apparel & Designer Textiles'] },
  { id: 'sa-azuay', name: 'Azuay Cargo Services', region: 'south-america', industry: 'Ecuadorian Highway Freight', rating: 86, preferredCargoTypes: ['Bulk Agricultural Grain & Feed', 'Retail Apparel & Designer Textiles'] },
  { id: 'sa-zenith-sa', name: 'Zenith Pan-American South', region: 'south-america', industry: 'Continental Freight Network', rating: 92, preferredCargoTypes: ['Electrical Substation Power Transformer', 'Modular Construction Machinery'] },

  // --- GLOBAL / MULTINATIONAL ---
  { id: 'glb-dhl', name: 'DHL Global Forwarding', region: 'global', industry: 'Global Logistics & Mail', rating: 98, preferredCargoTypes: ['High-Value Consumer Electronics', 'Frozen Pharmaceuticals & Vaccines', 'Retail Apparel & Designer Textiles'] },
  { id: 'glb-maersk', name: 'A.P. Moller - Maersk', region: 'global', industry: 'Integrated Container Logistics', rating: 99, preferredCargoTypes: ['High-Value Consumer Electronics', 'Fresh Agricultural Produce & Berries', 'Retail Apparel & Designer Textiles'] },
  { id: 'glb-kuehne', name: 'Kuehne+Nagel International', region: 'global', industry: 'Global Transport & Forwarding', rating: 98, preferredCargoTypes: ['Frozen Pharmaceuticals & Vaccines', 'Class 3 Flammable Industrial Solvents', 'High-Value Consumer Electronics'] },
  { id: 'glb-dsv', name: 'DSV Global Transport', region: 'global', industry: 'Transport & Air/Ocean/Road', rating: 96, preferredCargoTypes: ['Structural Steel Coils & Beams', 'Modular Construction Machinery', 'High-Value Consumer Electronics'] },
  { id: 'glb-db', name: 'DB Schenker Global', region: 'global', industry: 'Global Logistics Provider', rating: 95, preferredCargoTypes: ['Retail Apparel & Designer Textiles', 'High-Value Consumer Electronics', 'Frozen Pharmaceuticals & Vaccines'] },
  { id: 'glb-fedex', name: 'FedEx Corporation', region: 'global', industry: 'Global Express Delivery', rating: 97, preferredCargoTypes: ['High-Value Consumer Electronics', 'Frozen Pharmaceuticals & Vaccines'] },
  { id: 'glb-ups', name: 'United Parcel Service (UPS)', region: 'global', industry: 'Global Supply Chain & Freight', rating: 97, preferredCargoTypes: ['High-Value Consumer Electronics', 'Retail Apparel & Designer Textiles', 'Frozen Pharmaceuticals & Vaccines'] },
  { id: 'glb-agility', name: 'Agility Global Logistics', region: 'global', industry: 'Emerging Markets Infrastructure & Freight', rating: 93, preferredCargoTypes: ['Modular Construction Machinery', 'Refined Diesel & Aviation Jet A-1 Fuel'] },
  { id: 'glb-cevalogistics', name: 'CEVA Logistics', region: 'global', industry: 'Contract Logistics & Freight Management', rating: 94, preferredCargoTypes: ['High-Value Consumer Electronics', 'Modular Construction Machinery'] },
  { id: 'glb-panalpina', name: 'Panalpina World Transport', region: 'global', industry: 'Global Air & Ocean Freight', rating: 95, preferredCargoTypes: ['Frozen Pharmaceuticals & Vaccines', 'High-Value Consumer Electronics'] },
];

export class WorldCompanyRepository {
  public static getAll(): WorldShipperCompany[] {
    return WORLD_SHIPPER_COMPANIES;
  }

  public static getByRegion(region: string): WorldShipperCompany[] {
    if (!region) return WORLD_SHIPPER_COMPANIES;
    const norm = region.toLowerCase().trim().replace(/\s+/g, '-');
    const matched = WORLD_SHIPPER_COMPANIES.filter(
      c => c.region === norm || c.region === 'global' || norm.includes(c.region) || c.region.includes(norm)
    );
    if (matched.length > 0) return matched;
    return WORLD_SHIPPER_COMPANIES;
  }

  public static getRandomForRegion(region: string): WorldShipperCompany {
    const list = this.getByRegion(region);
    return list[Math.floor(Math.random() * list.length)] || WORLD_SHIPPER_COMPANIES[0];
  }
}

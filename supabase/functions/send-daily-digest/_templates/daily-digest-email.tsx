
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface ListingData {
  id: string
  title: string
  price: number
  source_name: string
  source_url: string
  location?: string
  listing_age?: string
  is_within_threshold: boolean
  is_within_slider_range: boolean
}

interface SearchConfigWithListings {
  id: string
  item_name: string
  manufacturer: string
  price_threshold: number
  listings: ListingData[]
}

interface DailyDigestEmailProps {
  user_email: string
  date: string
  searchConfigs: SearchConfigWithListings[]
  totalListings: number
  goodDeals: number
}

export const DailyDigestEmail = ({
  user_email,
  date,
  searchConfigs,
  totalListings,
  goodDeals,
}: DailyDigestEmailProps) => (
  <Html>
    <Head />
    <Preview>Your daily haystacks digest - {totalListings} new listings found</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🎯 Feed Me Haystacks Daily Digest</Heading>
        <Text style={dateText}>{date}</Text>
        
        <Section style={summarySection}>
          <Text style={summaryTitle}>📊 Today's Summary</Text>
          <Text style={summaryItem}>• {totalListings} new listings found</Text>
          <Text style={summaryItem}>• {goodDeals} listings under your price threshold</Text>
          <Text style={summaryItem}>• {searchConfigs.length} active searches</Text>
        </Section>

        <Hr style={divider} />

        {searchConfigs.map((config) => (
          <Section key={config.id} style={searchSection}>
            <Heading style={h2}>
              {config.manufacturer} {config.item_name}
            </Heading>
            <Text style={configInfo}>
              Price threshold: ${config.price_threshold.toLocaleString()} • 
              {config.listings.length} new listing{config.listings.length !== 1 ? 's' : ''}
            </Text>
            
            {config.listings.map((listing) => (
              <div key={listing.id} style={listingCard}>
                <div style={listingHeader}>
                  <Text style={listingTitle}>{listing.title}</Text>
                  <Text style={listing.is_within_threshold ? priceGood : priceNormal}>
                    ${listing.price.toLocaleString()}
                    {listing.is_within_threshold && ' 🎉'}
                  </Text>
                </div>
                <Text style={listingMeta}>
                  {listing.source_name} • {listing.location || 'Location N/A'} • {listing.listing_age || 'Age unknown'}
                </Text>
                <Link href={listing.source_url} style={viewLink}>
                  View Listing →
                </Link>
              </div>
            ))}
          </Section>
        ))}

        {totalListings === 0 && (
          <Section style={noListingsSection}>
            <Text style={noListingsText}>
              🔍 No new listings found today. We're still monitoring your searches and will notify you when deals appear!
            </Text>
          </Section>
        )}

        <Hr style={divider} />
        
        <Text style={footer}>
          <Link href="https://your-app-domain.com/tools/feedmehaystacks" style={footerLink}>
            Manage your searches
          </Link> • 
          <Link href="https://your-app-domain.com/unsubscribe" style={footerLink}>
            Unsubscribe
          </Link>
        </Text>
        
        <Text style={footerSmall}>
          You're receiving this because you have active price monitoring searches. 
          This digest was sent to {user_email}.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default DailyDigestEmail

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0 40px',
}

const h2 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '20px 0 10px',
}

const dateText = {
  color: '#666',
  fontSize: '14px',
  margin: '0 0 30px',
  padding: '0 40px',
}

const summarySection = {
  backgroundColor: '#f8f9fa',
  padding: '20px 40px',
  margin: '0 0 30px',
}

const summaryTitle = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 10px',
}

const summaryItem = {
  color: '#555',
  fontSize: '14px',
  margin: '5px 0',
}

const searchSection = {
  padding: '0 40px',
  marginBottom: '30px',
}

const configInfo = {
  color: '#666',
  fontSize: '14px',
  margin: '0 0 15px',
}

const listingCard = {
  border: '1px solid #e1e5e9',
  borderRadius: '6px',
  padding: '15px',
  marginBottom: '10px',
  backgroundColor: '#fafbfc',
}

const listingHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '8px',
}

const listingTitle = {
  color: '#333',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
  flex: '1',
  paddingRight: '10px',
}

const priceGood = {
  color: '#28a745',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0',
}

const priceNormal = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0',
}

const listingMeta = {
  color: '#666',
  fontSize: '12px',
  margin: '0 0 8px',
}

const viewLink = {
  color: '#007bff',
  fontSize: '13px',
  textDecoration: 'none',
  fontWeight: '500',
}

const divider = {
  borderColor: '#e1e5e9',
  margin: '30px 40px',
}

const noListingsSection = {
  padding: '40px',
  textAlign: 'center' as const,
}

const noListingsText = {
  color: '#666',
  fontSize: '16px',
  margin: '0',
}

const footer = {
  color: '#666',
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '40px 40px 20px',
}

const footerLink = {
  color: '#007bff',
  textDecoration: 'none',
}

const footerSmall = {
  color: '#999',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '0 40px',
  lineHeight: '16px',
}

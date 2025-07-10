
import { Listing, SearchConfig } from '@/types/database';
import { GeoUtils, DistanceInfo } from './geoUtils';

export interface EmailNotificationData {
  searchConfig: SearchConfig;
  newListings: Listing[];
  totalActiveListings: number;
  userLocation?: { latitude: number; longitude: number };
}

export interface GroupedListings {
  nearby: Listing[];
  regional: Listing[];
  distant: Listing[];
  unknown: Listing[];
}

export class EmailNotifier {
  static async sendNewListingsAlert(data: EmailNotificationData): Promise<void> {
    if (data.newListings.length === 0) {
      console.log('No new listings to notify about');
      return;
    }

    console.log(`Sending email notification for ${data.newListings.length} new listings`);

    try {
      // Group listings by proximity if user location is available
      const groupedListings = data.userLocation 
        ? await this.groupListingsByProximity(data.newListings, data.userLocation)
        : this.groupListingsWithoutLocation(data.newListings);

      const emailHtml = this.generateEmailHTML(data.searchConfig, groupedListings, data.totalActiveListings);
      const emailSubject = this.generateEmailSubject(data.searchConfig, data.newListings.length);

      // Send via Supabase Edge Function
      const response = await fetch('/functions/v1/send-listing-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: data.searchConfig.email_address,
          subject: emailSubject,
          html: emailHtml,
          searchConfig: {
            id: data.searchConfig.id,
            manufacturer: data.searchConfig.manufacturer,
            itemName: data.searchConfig.item_name,
            qualifier: data.searchConfig.qualifier,
            subQualifier: data.searchConfig.sub_qualifier
          },
          listingsCount: data.newListings.length
        })
      });

      if (!response.ok) {
        throw new Error(`Email notification failed: ${response.status}`);
      }

      console.log('Email notification sent successfully');
    } catch (error) {
      console.error('Failed to send email notification:', error);
      throw error;
    }
  }

  private static async groupListingsByProximity(
    listings: Listing[], 
    userLocation: { latitude: number; longitude: number }
  ): Promise<GroupedListings> {
    const grouped: GroupedListings = {
      nearby: [],
      regional: [],
      distant: [],
      unknown: []
    };

    for (const listing of listings) {
      try {
        const { distanceInfo } = await GeoUtils.enrichListingWithLocation(
          { location: listing.location, title: listing.title },
          userLocation
        );

        if (distanceInfo) {
          grouped[distanceInfo.bucket].push(listing);
        } else {
          grouped.unknown.push(listing);
        }
      } catch (error) {
        console.error('Error calculating distance for listing:', error);
        grouped.unknown.push(listing);
      }
    }

    return grouped;
  }

  private static groupListingsWithoutLocation(listings: Listing[]): GroupedListings {
    return {
      nearby: [],
      regional: [],
      distant: [],
      unknown: listings
    };
  }

  private static generateEmailSubject(searchConfig: SearchConfig, count: number): string {
    const itemDescription = [
      searchConfig.manufacturer,
      searchConfig.item_name,
      searchConfig.qualifier,
      searchConfig.sub_qualifier
    ].filter(Boolean).join(' ');

    return `🎯 ${count} New ${itemDescription} Deal${count > 1 ? 's' : ''} Found!`;
  }

  private static generateEmailHTML(
    searchConfig: SearchConfig,
    groupedListings: GroupedListings,
    totalActiveListings: number
  ): string {
    const itemDescription = [
      searchConfig.manufacturer,
      searchConfig.item_name,
      searchConfig.qualifier,
      searchConfig.sub_qualifier
    ].filter(Boolean).join(' ');

    const totalNew = Object.values(groupedListings).reduce((sum, group) => sum + group.length, 0);

    let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .content { padding: 30px 20px; }
        .summary { background: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .summary-item { text-align: center; }
        .summary-number { font-size: 24px; font-weight: bold; color: #1e40af; }
        .summary-label { font-size: 14px; color: #64748b; margin-top: 4px; }
        .proximity-section { margin-bottom: 30px; }
        .proximity-title { font-size: 18px; font-weight: bold; color: #1e293b; margin-bottom: 15px; display: flex; align-items: center; }
        .proximity-icon { margin-right: 8px; }
        .listing { border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 12px; transition: transform 0.2s; }
        .listing:hover { transform: translateY(-1px); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .listing-title { font-weight: bold; color: #1e293b; margin-bottom: 8px; }
        .listing-price { font-size: 18px; font-weight: bold; color: #059669; margin-bottom: 8px; }
        .listing-price.threshold { color: #dc2626; }
        .listing-price.slider { color: #d97706; }
        .listing-details { font-size: 14px; color: #64748b; line-height: 1.4; }
        .listing-source { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-top: 8px; }
        .view-button { display: inline-block; background: #4f46e5; color: white; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; margin-top: 10px; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 14px; color: #64748b; }
        .footer a { color: #4f46e5; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 New Deals Found!</h1>
            <p>Fresh listings for your ${itemDescription} search</p>
        </div>
        
        <div class="content">
            <div class="summary">
                <div class="summary-grid">
                    <div class="summary-item">
                        <div class="summary-number">${totalNew}</div>
                        <div class="summary-label">New Listings</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-number">${totalActiveListings}</div>
                        <div class="summary-label">Total Active</div>
                    </div>
                </div>
            </div>`;

    // Add proximity sections
    if (groupedListings.nearby.length > 0) {
      html += this.generateProximitySection('📍 Nearby (Within 100 miles)', groupedListings.nearby, searchConfig);
    }

    if (groupedListings.regional.length > 0) {
      html += this.generateProximitySection('🗺️ Regional (100-500 miles)', groupedListings.regional, searchConfig);
    }

    if (groupedListings.distant.length > 0) {
      html += this.generateProximitySection('✈️ Distant (Over 500 miles)', groupedListings.distant, searchConfig);
    }

    if (groupedListings.unknown.length > 0) {
      html += this.generateProximitySection('🔍 All Locations', groupedListings.unknown, searchConfig);
    }

    html += `
        </div>
        
        <div class="footer">
            <p>Happy hunting! 🏹</p>
            <p><a href="#">Manage your searches</a> | <a href="#">Unsubscribe</a></p>
        </div>
    </div>
</body>
</html>`;

    return html;
  }

  private static generateProximitySection(title: string, listings: Listing[], searchConfig: SearchConfig): string {
    if (listings.length === 0) return '';

    let html = `
            <div class="proximity-section">
                <div class="proximity-title">${title}</div>`;

    for (const listing of listings) {
      const priceClass = listing.is_within_threshold ? 'threshold' : 
                        listing.is_within_slider_range ? 'slider' : '';
      
      const priceLabel = listing.is_within_threshold ? '🎯 Under Threshold!' : 
                        listing.is_within_slider_range ? '📊 In Range' : '💰 Above Range';

      html += `
                <div class="listing">
                    <div class="listing-title">${this.escapeHtml(listing.title)}</div>
                    <div class="listing-price ${priceClass}">$${listing.price.toLocaleString()} ${priceLabel}</div>
                    <div class="listing-details">
                        📍 ${this.escapeHtml(listing.location || 'Location not specified')}<br>
                        ⏰ ${this.escapeHtml(listing.listing_age || 'Recently posted')}
                    </div>
                    <span class="listing-source">${listing.source_name}</span>
                    <a href="${listing.source_url}" class="view-button" target="_blank">View Listing →</a>
                </div>`;
    }

    html += `
            </div>`;

    return html;
  }

  private static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

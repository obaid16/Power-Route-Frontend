import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../hooks/useResponsive';

export function Footer() {
  const { isMobile, isTablet, isLargeScreen } = useResponsive();
  const isDesktop = isLargeScreen || (!isMobile && !isTablet);
  
  return (
    <View style={styles.footerContainer}>
      <View style={[styles.content, isDesktop ? styles.rowLayout : styles.colLayout]}>
        
        {/* Left Section - Brand */}
        <View style={styles.brandSection}>
          <View style={styles.brandLogoRow}>
            <View style={styles.logoIcon}>
              <Ionicons name="flash" size={14} color="#ffffff" />
            </View>
            <Text style={styles.brandText}>ELECTRA</Text>
          </View>
          <Text style={styles.brandDesc}>
            Building a smarter, cleaner{'\n'}and safer future with{'\n'}electric mobility.
          </Text>
          
          {isDesktop && (
            <Text style={styles.copyrightText}>
              © 2024 Electra Mobility. All rights reserved.
            </Text>
          )}
        </View>

        {/* Links Section */}
        <View style={[styles.linksSection, isDesktop ? styles.linksRow : styles.linksCol]}>
          <View style={styles.linkGroup}>
            <Text style={styles.linkGroupTitle}>COMPANY</Text>
            <Text style={styles.linkItem}>About Us</Text>
            <Text style={styles.linkItem}>Careers</Text>
            <Text style={styles.linkItem}>Blog</Text>
            <Text style={styles.linkItem}>Contact Us</Text>
          </View>

          <View style={styles.linkGroup}>
            <Text style={styles.linkGroupTitle}>SUPPORT</Text>
            <Text style={styles.linkItem}>Help Center</Text>
            <Text style={styles.linkItem}>FAQs</Text>
            <Text style={styles.linkItem}>Terms & Conditions</Text>
            <Text style={styles.linkItem}>Privacy Policy</Text>
          </View>

          <View style={styles.linkGroup}>
            <Text style={styles.linkGroupTitle}>SERVICES</Text>
            <Text style={styles.linkItem}>Charging Network</Text>
            <Text style={styles.linkItem}>Vehicle Booking</Text>
            <Text style={styles.linkItem}>Subscriptions</Text>
            <Text style={styles.linkItem}>Corporate Solutions</Text>
          </View>
        </View>

        {/* Right Section - Socials */}
        <View style={[styles.socialSection, isDesktop && { alignItems: 'center' }]}>
          <Text style={styles.linkGroupTitle}>FOLLOW US</Text>
          <View style={isDesktop ? styles.socialCol : styles.socialRow}>
            <View style={styles.socialIconBox}><Ionicons name="logo-facebook" size={16} color="#e2e8f0" /></View>
            <View style={styles.socialIconBox}><Ionicons name="logo-twitter" size={16} color="#e2e8f0" /></View>
            <View style={styles.socialIconBox}><Ionicons name="logo-instagram" size={16} color="#e2e8f0" /></View>
            <View style={styles.socialIconBox}><Ionicons name="logo-linkedin" size={16} color="#e2e8f0" /></View>
          </View>
        </View>

      </View>
      
      {!isDesktop && (
        <Text style={[styles.copyrightText, { marginTop: 32 }]}>
          © 2024 Electra Mobility. All rights reserved.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: '#0c0a15',
    borderRadius: 16,
    padding: 32,
    marginTop: 40,
    borderWidth: 1,
    borderColor: '#1f1c2c',
  },
  content: {
    justifyContent: 'space-between',
  },
  rowLayout: {
    flexDirection: 'row',
  },
  colLayout: {
    flexDirection: 'column',
    gap: 32,
  },
  brandSection: {
    flex: 1,
    paddingRight: 24,
    justifyContent: 'space-between',
  },
  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  logoIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#9333ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brandDesc: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 22,
    marginBottom: 40,
  },
  copyrightText: {
    color: '#64748b',
    fontSize: 12,
  },
  linksSection: {
    flex: 2,
    justifyContent: 'space-around',
  },
  linksRow: {
    flexDirection: 'row',
  },
  linksCol: {
    flexDirection: 'column',
    gap: 24,
  },
  linkGroup: {
    alignItems: 'flex-start',
  },
  linkGroupTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  linkItem: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 12,
  },
  socialSection: {
    flex: 0.5,
    alignItems: 'flex-start',
  },
  socialCol: {
    flexDirection: 'column',
    gap: 10,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1f1b2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

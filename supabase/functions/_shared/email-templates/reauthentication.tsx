/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Bcoming verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandHeader}>
          <Text style={brandName}>Bcoming</Text>
          <Text style={brandTagline}>Become who you're meant to be</Text>
        </Section>

        <Heading style={h1}>Confirm it's you</Heading>
        <Text style={text}>Use the code below to confirm your identity:</Text>

        <Section style={codeContainer}>
          <Text style={codeStyle}>{token}</Text>
        </Section>

        <Section style={divider} />

        <Text style={footer}>
          This code will expire shortly. If you didn't request this, you can safely ignore this email.
        </Text>
        <Text style={signature}>— The Bcoming team</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", Arial, sans-serif',
  margin: 0,
  padding: '40px 0',
}
const container = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '32px 28px',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #ece9f7',
}
const brandHeader = {
  textAlign: 'center' as const,
  padding: '8px 0 28px',
  borderBottom: '1px solid #f0edfa',
  marginBottom: '28px',
}
const brandName = {
  fontSize: '22px',
  fontWeight: 700,
  color: '#7a3df0',
  letterSpacing: '-0.02em',
  margin: 0,
}
const brandTagline = {
  fontSize: '12px',
  color: '#9b96b8',
  margin: '4px 0 0',
  letterSpacing: '0.02em',
}
const h1 = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#15102b',
  margin: '0 0 16px',
  letterSpacing: '-0.01em',
}
const text = {
  fontSize: '15px',
  color: '#4a4566',
  lineHeight: '1.6',
  margin: '0 0 18px',
}
const codeContainer = {
  textAlign: 'center' as const,
  margin: '28px 0',
  padding: '24px',
  background: 'linear-gradient(135deg, rgba(61, 122, 240, 0.08) 0%, rgba(122, 61, 240, 0.10) 50%, rgba(201, 61, 173, 0.08) 100%)',
  borderRadius: '12px',
  border: '1px solid #ece9f7',
}
const codeStyle = {
  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
  fontSize: '32px',
  fontWeight: 700,
  color: '#7a3df0',
  letterSpacing: '0.2em',
  margin: 0,
}
const divider = { borderTop: '1px solid #f0edfa', margin: '32px 0 20px' }
const footer = {
  fontSize: '12px',
  color: '#9b96b8',
  lineHeight: '1.5',
  margin: '0 0 8px',
}
const signature = {
  fontSize: '12px',
  color: '#7a3df0',
  fontWeight: 600,
  margin: '8px 0 0',
}

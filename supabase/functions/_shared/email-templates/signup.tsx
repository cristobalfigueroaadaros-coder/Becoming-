/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to Bcoming — confirm your email to begin</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandHeader}>
          <Text style={brandName}>Bcoming</Text>
          <Text style={brandTagline}>Become who you're meant to be</Text>
        </Section>

        <Heading style={h1}>You're in. Let's begin.</Heading>
        <Text style={text}>
          Welcome to <Link href={siteUrl} style={link}>Bcoming</Link>. You're a single click away from your journey of self-discovery.
        </Text>
        <Text style={text}>
          Confirm <strong style={emailHighlight}>{recipient}</strong> to unlock your space:
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={confirmationUrl}>
            Confirm & Begin
          </Button>
        </Section>

        <Text style={smallText}>
          Or paste this link into your browser:
          <br />
          <Link href={confirmationUrl} style={linkSmall}>{confirmationUrl}</Link>
        </Text>

        <Section style={divider} />

        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
        <Text style={signature}>— The Bcoming team</Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
const emailHighlight = { color: '#15102b' }
const link = { color: '#7a3df0', textDecoration: 'underline', fontWeight: 600 }
const buttonContainer = { textAlign: 'center' as const, margin: '28px 0' }
const button = {
  background: 'linear-gradient(135deg, #3d7af0 0%, #7a3df0 50%, #c93dad 100%)',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600,
  borderRadius: '12px',
  padding: '14px 32px',
  textDecoration: 'none',
  display: 'inline-block',
  boxShadow: '0 4px 14px rgba(122, 61, 240, 0.35)',
}
const smallText = {
  fontSize: '12px',
  color: '#9b96b8',
  lineHeight: '1.5',
  margin: '20px 0 0',
}
const linkSmall = { color: '#7a3df0', textDecoration: 'underline', wordBreak: 'break-all' as const }
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

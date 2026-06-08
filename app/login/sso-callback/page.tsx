import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

/** OAuth / SSO return when sign-in uses path routing on /login */
export default function LoginSSOCallbackPage() {
  return (
    <>
      <AuthenticateWithRedirectCallback />
      <div id="clerk-captcha" />
    </>
  );
}

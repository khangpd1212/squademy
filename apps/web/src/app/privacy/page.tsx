import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Privacy Policy</CardTitle>
          <CardDescription>
            Squademy stores only the minimum information required to provide your learning account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            By creating an account, you agree that we may process your registration details and
            activity data to operate core learning features.
          </p>
          <p>
            You can request data export and account deletion from privacy settings in later account
            management stories.
          </p>
          <p>
            <Link href="/register" className="underline underline-offset-4 hover:text-primary">
              Back to registration
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

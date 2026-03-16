import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type CheckEmailPageProps = {
  searchParams?: Promise<{ email?: string }>;
};

export default async function CheckEmailPage({ searchParams }: CheckEmailPageProps) {
  const params = await searchParams;
  const email = params?.email;

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Check your email</CardTitle>
        <CardDescription>
          We sent a confirmation link{email ? ` to ${email}` : ""}. Confirm your account to
          continue.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>If you do not see it, check your spam folder and try again.</p>
        <p className="text-center">
          Ready to continue?{" "}
          <Link href="/login" className="underline underline-offset-4 hover:text-primary">
            Go to login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

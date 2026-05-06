import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BackupCodeForm from './components/BackupCode';

export default function BackupCodePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Backup code</CardTitle>
          <CardDescription>Enter one of your 8-character backup codes.</CardDescription>
        </CardHeader>
        <CardContent>
          <BackupCodeForm />
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TwoFASetup } from './components/Security';

export default function SecuritySettingsPage() {
  return (
    <div className="max-w-xl mx-auto py-10 px-4 space-y-6">
      <h1 className="text-2xl font-bold">Security settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <TwoFASetup />
        </CardContent>
      </Card>
    </div>
  );
}

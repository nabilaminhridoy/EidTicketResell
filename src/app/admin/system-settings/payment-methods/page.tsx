'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  Loader2, CreditCard, CheckCircle2, XCircle, RefreshCw, Eye, EyeOff,
  Globe, Key, Link as LinkIcon, Webhook, ArrowRightLeft, AlertCircle,
  BookOpen, ExternalLink, Settings, Shield
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface BkashConfig {
  isEnabled: boolean
  isSandbox: boolean
  credentials: {
    appKey: string
    appSecret: string
    username: string
    password: string
  }
}

interface UddoktaPayConfig {
  isEnabled: boolean
  isSandbox: boolean
  apiKey: string
  baseUrl: string
  apiType: string
  redirectUrl: string
  cancelUrl: string
  webhookUrl: string
}

export default function PaymentMethodsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState<string | null>(null)
  const [isTesting, setIsTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({})
  
  const [bkashForm, setBkashForm] = useState<BkashConfig>({
    isEnabled: false,
    isSandbox: true,
    credentials: {
      appKey: '',
      appSecret: '',
      username: '',
      password: '',
    },
  })

  const [nagadForm, setNagadForm] = useState({
    enabled: false,
    sandbox: true,
    merchantId: '',
    merchantNumber: '',
    publicKey: '',
    privateKey: '',
  })

  const [uddoktaPayForm, setUddoktaPayForm] = useState<UddoktaPayConfig>({
    isEnabled: false,
    isSandbox: true,
    apiKey: '',
    baseUrl: '',
    apiType: 'checkout-v2',
    redirectUrl: '',
    cancelUrl: '',
    webhookUrl: '',
  })

  const [pipraPayForm, setPipraPayForm] = useState({
    isEnabled: false,
    isSandbox: true,
    apiKey: '',
    baseUrl: '',
    redirectUrl: '',
    cancelUrl: '',
    webhookUrl: '',
    currency: 'BDT',
    returnType: 'POST',
  })

  // API Type options for UddoktaPay
  const uddoktaPayApiTypes = [
    { value: 'checkout', label: 'Checkout (IPN)', description: 'Basic checkout with IPN notification' },
    { value: 'checkout-v2', label: 'Checkout V2 (Success Page)', description: 'Advanced checkout with success page notification (Recommended)' },
    { value: 'checkout/global', label: 'Checkout Global (IPN)', description: 'Global basic checkout with IPN' },
    { value: 'checkout-v2/global', label: 'Checkout V2 Global', description: 'Global advanced checkout with success page' },
  ]

  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    setIsLoading(true)
    try {
      // Load bKash config
      const bkashRes = await fetch('/api/admin/payment-gateways/bkash')
      if (bkashRes.ok) {
        const data = await bkashRes.json()
        if (data.gateway) {
          setBkashForm({
            isEnabled: data.gateway.isEnabled || false,
            isSandbox: data.gateway.isSandbox !== false,
            credentials: {
              appKey: data.gateway.credentials?.appKey || '',
              appSecret: data.gateway.credentials?.appSecret || '',
              username: data.gateway.credentials?.username || '',
              password: data.gateway.credentials?.password || '',
            },
          })
        }
      }

      // Load UddoktaPay config
      const uddoktaRes = await fetch('/api/admin/payment-gateways/uddoktapay')
      if (uddoktaRes.ok) {
        const data = await uddoktaRes.json()
        if (data.gateway) {
          setUddoktaPayForm({
            isEnabled: data.gateway.isEnabled || false,
            isSandbox: data.gateway.isSandbox !== false,
            apiKey: data.gateway.credentials?.apiKey || '',
            baseUrl: data.gateway.credentials?.baseUrl || '',
            apiType: data.gateway.credentials?.apiType || 'checkout-v2',
            redirectUrl: data.gateway.credentials?.redirectUrl || '',
            cancelUrl: data.gateway.credentials?.cancelUrl || '',
            webhookUrl: data.gateway.credentials?.webhookUrl || '',
          })
        }
      }
    } catch (error) {
      console.error('Error loading configs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveBkash = async () => {
    setIsSaving('bkash')
    try {
      const response = await fetch('/api/admin/payment-gateways/bkash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bkashForm),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'bKash Configuration Saved',
          description: 'Your bKash payment gateway settings have been saved successfully.',
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to save bKash configuration',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save bKash configuration',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(null)
    }
  }

  const handleSaveUddoktaPay = async () => {
    setIsSaving('uddoktapay')
    try {
      const response = await fetch('/api/admin/payment-gateways/uddoktapay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isEnabled: uddoktaPayForm.isEnabled,
          isSandbox: uddoktaPayForm.isSandbox,
          credentials: {
            apiKey: uddoktaPayForm.apiKey,
            baseUrl: uddoktaPayForm.baseUrl,
            apiType: uddoktaPayForm.apiType,
            redirectUrl: uddoktaPayForm.redirectUrl,
            cancelUrl: uddoktaPayForm.cancelUrl,
            webhookUrl: uddoktaPayForm.webhookUrl,
          },
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'UddoktaPay Configuration Saved',
          description: 'Your UddoktaPay payment gateway settings have been saved successfully.',
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to save UddoktaPay configuration',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save UddoktaPay configuration',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(null)
    }
  }

  const handleTestUddoktaPay = async () => {
    setIsTesting('uddoktapay')
    setTestResult(null)
    try {
      const response = await fetch('/api/admin/payment-gateways/uddoktapay/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: uddoktaPayForm.apiKey,
          baseUrl: uddoktaPayForm.baseUrl || (uddoktaPayForm.isSandbox 
            ? 'https://sandbox.uddoktapay.com/api' 
            : ''),
        }),
      })

      const data = await response.json()

      setTestResult({
        success: data.success,
        message: data.message || (data.success ? 'Connection successful!' : 'Connection failed'),
      })

      toast({
        title: data.success ? 'Connection Successful' : 'Connection Failed',
        description: data.message,
        variant: data.success ? 'default' : 'destructive',
      })
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'Failed to test connection',
      })
      toast({
        title: 'Test Failed',
        description: 'Failed to connect to UddoktaPay gateway',
        variant: 'destructive',
      })
    } finally {
      setIsTesting(null)
    }
  }

  const toggleShowCredential = (field: string) => {
    setShowCredentials(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const handleSavePipraPay = async () => {
    setIsSaving('piprapay')
    try {
      const response = await fetch('/api/admin/payment-gateways/piprapay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isEnabled: pipraPayForm.isEnabled,
          isSandbox: pipraPayForm.isSandbox,
          credentials: {
            apiKey: pipraPayForm.apiKey,
            baseUrl: pipraPayForm.baseUrl,
            redirectUrl: pipraPayForm.redirectUrl,
            cancelUrl: pipraPayForm.cancelUrl,
            webhookUrl: pipraPayForm.webhookUrl,
            currency: pipraPayForm.currency,
            returnType: pipraPayForm.returnType,
          },
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'PipraPay Configuration Saved',
          description: 'Your PipraPay payment gateway settings have been saved successfully.',
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to save PipraPay configuration',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save PipraPay configuration',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(null)
    }
  }

  const handleTestPipraPay = async () => {
    setIsTesting('piprapay')
    setTestResult(null)
    try {
      const response = await fetch('/api/admin/payment-gateways/piprapay/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: pipraPayForm.apiKey,
          baseUrl: pipraPayForm.baseUrl || (pipraPayForm.isSandbox 
            ? 'https://sandbox.piprapay.com' 
            : ''),
        }),
      })

      const data = await response.json()

      setTestResult({
        success: data.success,
        message: data.message || (data.success ? 'Connection successful!' : 'Connection failed'),
      })

      toast({
        title: data.success ? 'Connection Successful' : 'Connection Failed',
        description: data.message,
        variant: data.success ? 'default' : 'destructive',
      })
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'Failed to test connection',
      })
      toast({
        title: 'Test Failed',
        description: 'Failed to connect to PipraPay gateway',
        variant: 'destructive',
      })
    } finally {
      setIsTesting(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Methods</h1>
          <p className="text-muted-foreground">Configure payment gateways for receiving payments</p>
        </div>
      </div>

      <Tabs defaultValue="uddoktapay" className="space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="bkash" className="gap-2">
            <span>bKash</span>
            {bkashForm.isEnabled && (
              <Badge variant="default" className="ml-1 h-5 px-1.5 text-xs bg-green-600">Active</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="nagad">Nagad</TabsTrigger>
          <TabsTrigger value="uddoktapay" className="gap-2">
            <span>UddoktaPay</span>
            {uddoktaPayForm.isEnabled && (
              <Badge variant="default" className="ml-1 h-5 px-1.5 text-xs bg-green-600">Active</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="piprapay" className="gap-2">
            <span>PipraPay</span>
            {pipraPayForm.isEnabled && (
              <Badge variant="default" className="ml-1 h-5 px-1.5 text-xs bg-green-600">Active</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* UddoktaPay */}
        <TabsContent value="uddoktapay">
          <div className="space-y-6">
            {/* Main Configuration Card */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      UddoktaPay Payment Gateway
                    </CardTitle>
                    <CardDescription>
                      Self-hosted payment automation software for Bangladesh
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={uddoktaPayForm.isEnabled}
                        onCheckedChange={(checked) => setUddoktaPayForm({ ...uddoktaPayForm, isEnabled: checked })}
                      />
                      <span className="text-sm font-medium">{uddoktaPayForm.isEnabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status Badge */}
                <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : uddoktaPayForm.isEnabled ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">
                      {isLoading ? 'Loading...' : uddoktaPayForm.isEnabled ? 'Gateway Active' : 'Gateway Inactive'}
                    </span>
                  </div>
                  <Badge variant={uddoktaPayForm.isSandbox ? 'secondary' : 'default'}>
                    {uddoktaPayForm.isSandbox ? 'Sandbox Mode' : 'Production Mode'}
                  </Badge>
                </div>

                {/* Mode Toggle */}
                <div className="flex flex-wrap items-center justify-between p-4 border rounded-lg gap-4">
                  <div>
                    <Label className="font-semibold">Sandbox Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable for testing. Disable for production payments.
                    </p>
                  </div>
                  <Switch
                    checked={uddoktaPayForm.isSandbox}
                    onCheckedChange={(checked) => setUddoktaPayForm({ ...uddoktaPayForm, isSandbox: checked })}
                  />
                </div>

                {/* API Configuration */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    API Configuration
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Get your API credentials from UddoktaPay dashboard.{' '}
                    <a 
                      href="https://uddoktapay.readme.io/reference/api-information" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      View Documentation
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* API Key */}
                    <div className="space-y-2">
                      <Label htmlFor="uddoktapay-apiKey">API Key</Label>
                      <div className="relative">
                        <Input
                          id="uddoktapay-apiKey"
                          type={showCredentials['uddoktapay-apiKey'] ? 'text' : 'password'}
                          value={uddoktaPayForm.apiKey}
                          onChange={(e) => setUddoktaPayForm({ ...uddoktaPayForm, apiKey: e.target.value })}
                          placeholder={uddoktaPayForm.isSandbox ? "982d381360a69d419689740d9f2e26ce36fb7a50" : "Enter your API Key"}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => toggleShowCredential('uddoktapay-apiKey')}
                        >
                          {showCredentials['uddoktapay-apiKey'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Base URL */}
                    <div className="space-y-2">
                      <Label htmlFor="uddoktapay-baseUrl">Base URL</Label>
                      <Input
                        id="uddoktapay-baseUrl"
                        value={uddoktaPayForm.baseUrl}
                        onChange={(e) => setUddoktaPayForm({ ...uddoktaPayForm, baseUrl: e.target.value })}
                        placeholder={uddoktaPayForm.isSandbox ? "https://sandbox.uddoktapay.com/api" : "https://yourdomain.com/api"}
                      />
                      {uddoktaPayForm.isSandbox && (
                        <p className="text-xs text-muted-foreground">
                          Sandbox URL: https://sandbox.uddoktapay.com/api
                        </p>
                      )}
                    </div>
                  </div>

                  {/* API Type */}
                  <div className="space-y-2">
                    <Label htmlFor="uddoktapay-apiType">API Type</Label>
                    <Select
                      value={uddoktaPayForm.apiType}
                      onValueChange={(value) => setUddoktaPayForm({ ...uddoktaPayForm, apiType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select API Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {uddoktaPayApiTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <span className="font-medium">{type.label}</span>
                              <span className="text-xs text-muted-foreground ml-2">- {type.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Checkout V2 is recommended for most use cases. It provides success page notifications.
                    </p>
                  </div>
                </div>

                {/* URL Configuration */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    URL Configuration
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Redirect URL */}
                    <div className="space-y-2">
                      <Label htmlFor="uddoktapay-redirectUrl">Success Redirect URL</Label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="uddoktapay-redirectUrl"
                          value={uddoktaPayForm.redirectUrl}
                          onChange={(e) => setUddoktaPayForm({ ...uddoktaPayForm, redirectUrl: e.target.value })}
                          placeholder="https://yoursite.com/payment/success"
                          className="pl-9"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">User redirected here after successful payment</p>
                    </div>

                    {/* Cancel URL */}
                    <div className="space-y-2">
                      <Label htmlFor="uddoktapay-cancelUrl">Cancel URL</Label>
                      <div className="relative">
                        <XCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="uddoktapay-cancelUrl"
                          value={uddoktaPayForm.cancelUrl}
                          onChange={(e) => setUddoktaPayForm({ ...uddoktaPayForm, cancelUrl: e.target.value })}
                          placeholder="https://yoursite.com/payment/cancel"
                          className="pl-9"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">User redirected here if payment cancelled</p>
                    </div>

                    {/* Webhook URL */}
                    <div className="space-y-2">
                      <Label htmlFor="uddoktapay-webhookUrl">Webhook URL (IPN)</Label>
                      <div className="relative">
                        <Webhook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="uddoktapay-webhookUrl"
                          value={uddoktaPayForm.webhookUrl}
                          onChange={(e) => setUddoktaPayForm({ ...uddoktaPayForm, webhookUrl: e.target.value })}
                          placeholder="https://yoursite.com/api/webhook/uddoktapay"
                          className="pl-9"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">For IPN notifications (optional for V2)</p>
                    </div>
                  </div>
                </div>

                {/* API Endpoints Reference */}
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    API Endpoints Reference
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Sandbox Base URL:</span>
                      <code className="block bg-background px-2 py-1 rounded text-xs">
                        https://sandbox.uddoktapay.com/api
                      </code>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Create Charge:</span>
                      <code className="block bg-background px-2 py-1 rounded text-xs">
                        POST /checkout-v2
                      </code>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Verify Payment:</span>
                      <code className="block bg-background px-2 py-1 rounded text-xs">
                        POST /verify-payment
                      </code>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Refund Payment:</span>
                      <code className="block bg-background px-2 py-1 rounded text-xs">
                        POST /refund-payment
                      </code>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 pt-2">
                    <a 
                      href="https://uddoktapay.readme.io/reference/create-charge-api-guideline" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs inline-flex items-center gap-1"
                    >
                      Create Charge Docs <ExternalLink className="w-3 h-3" />
                    </a>
                    <a 
                      href="https://uddoktapay.readme.io/reference/verify-payment-api-guideline" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs inline-flex items-center gap-1"
                    >
                      Verify Payment Docs <ExternalLink className="w-3 h-3" />
                    </a>
                    <a 
                      href="https://uddoktapay.readme.io/reference/validate-webhook" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs inline-flex items-center gap-1"
                    >
                      Webhook Docs <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-4">
                  <Button 
                    className="btn-primary"
                    onClick={handleSaveUddoktaPay} 
                    disabled={isSaving === 'uddoktapay'}
                  >
                    {isSaving === 'uddoktapay' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Configuration'
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleTestUddoktaPay} 
                    disabled={isTesting === 'uddoktapay' || !uddoktaPayForm.apiKey}
                  >
                    {isTesting === 'uddoktapay' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Test Connection
                      </>
                    )}
                  </Button>
                </div>

                {/* Test Result */}
                {testResult && (
                  <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    <div className="flex items-center gap-2">
                      {testResult.success ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                      <span className="font-medium">{testResult.message}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* API Abilities Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  API Key Abilities
                </CardTitle>
                <CardDescription>
                  Required permissions for your API key
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">payment:checkout</p>
                      <p className="text-xs text-muted-foreground">Create payment requests</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">payment:verify</p>
                      <p className="text-xs text-muted-foreground">Verify payment status</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">payment:refund</p>
                      <p className="text-xs text-muted-foreground">Process refunds</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Create your API key with all three abilities in UddoktaPay dashboard: Brand Settings → API
                </p>
              </CardContent>
            </Card>

            {/* Create Charge Request Example */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Create Charge Request Example
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto text-xs">
{`{
  "full_name": "Customer Name",
  "email": "customer@email.com",
  "amount": 100,
  "metadata": {
    "order_id": "ORDER_123",
    "customer_id": "CUST_456"
  },
  "redirect_url": "` + (uddoktaPayForm.redirectUrl || 'https://yoursite.com/success') + `",
  "return_type": "GET",
  "cancel_url": "` + (uddoktaPayForm.cancelUrl || 'https://yoursite.com/cancel') + `",
  "webhook_url": "` + (uddoktaPayForm.webhookUrl || 'https://yoursite.com/webhook') + `"
}`}
                </pre>
                <p className="text-xs text-muted-foreground mt-2">
                  Response includes <code className="bg-muted px-1 rounded">payment_url</code> to redirect customer
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* bKash */}
        <TabsContent value="bkash">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    bKash Tokenized Checkout
                  </CardTitle>
                  <CardDescription>
                    Configure bKash tokenized checkout for secure payments
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={bkashForm.isEnabled}
                      onCheckedChange={(checked) => setBkashForm({ ...bkashForm, isEnabled: checked })}
                    />
                    <span className="text-sm font-medium">{bkashForm.isEnabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Badge */}
              <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : bkashForm.isEnabled ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">
                    {isLoading ? 'Loading...' : bkashForm.isEnabled ? 'Gateway Active' : 'Gateway Inactive'}
                  </span>
                </div>
                <Badge variant={bkashForm.isSandbox ? 'secondary' : 'default'}>
                  {bkashForm.isSandbox ? 'Sandbox Mode' : 'Production Mode'}
                </Badge>
              </div>

              {/* Mode Toggle */}
              <div className="flex flex-wrap items-center justify-between p-4 border rounded-lg gap-4">
                <div>
                  <Label className="font-semibold">Sandbox Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable for testing. Disable for production payments.
                  </p>
                </div>
                <Switch
                  checked={bkashForm.isSandbox}
                  onCheckedChange={(checked) => setBkashForm({ ...bkashForm, isSandbox: checked })}
                />
              </div>

              {/* Credentials */}
              <div className="space-y-4">
                <h3 className="font-semibold">API Credentials</h3>
                <p className="text-sm text-muted-foreground">
                  Get your credentials from the bKash Payment Gateway Portal.{' '}
                  <a 
                    href="https://support.pgw-int.bkash.com/#/login" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Get Credentials
                  </a>
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bkash-appKey">App Key</Label>
                    <div className="relative">
                      <Input
                        id="bkash-appKey"
                        type={showCredentials['appKey'] ? 'text' : 'password'}
                        value={bkashForm.credentials.appKey}
                        onChange={(e) => setBkashForm({
                          ...bkashForm,
                          credentials: { ...bkashForm.credentials, appKey: e.target.value }
                        })}
                        placeholder="Enter App Key"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => toggleShowCredential('appKey')}
                      >
                        {showCredentials['appKey'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bkash-appSecret">App Secret</Label>
                    <div className="relative">
                      <Input
                        id="bkash-appSecret"
                        type={showCredentials['appSecret'] ? 'text' : 'password'}
                        value={bkashForm.credentials.appSecret}
                        onChange={(e) => setBkashForm({
                          ...bkashForm,
                          credentials: { ...bkashForm.credentials, appSecret: e.target.value }
                        })}
                        placeholder="Enter App Secret"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => toggleShowCredential('appSecret')}
                      >
                        {showCredentials['appSecret'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bkash-username">Username</Label>
                    <Input
                      id="bkash-username"
                      value={bkashForm.credentials.username}
                      onChange={(e) => setBkashForm({
                        ...bkashForm,
                        credentials: { ...bkashForm.credentials, username: e.target.value }
                      })}
                      placeholder="Enter Username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bkash-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="bkash-password"
                        type={showCredentials['password'] ? 'text' : 'password'}
                        value={bkashForm.credentials.password}
                        onChange={(e) => setBkashForm({
                          ...bkashForm,
                          credentials: { ...bkashForm.credentials, password: e.target.value }
                        })}
                        placeholder="Enter Password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => toggleShowCredential('password')}
                      >
                        {showCredentials['password'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* API Endpoints Info */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">API Endpoints</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Sandbox:</span>{' '}
                    <code className="bg-background px-1 py-0.5 rounded">
                      https://tokenized.sandbox.bka.sh/v1.2.0-beta
                    </code>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Production:</span>{' '}
                    <code className="bg-background px-1 py-0.5 rounded">
                      https://tokenized.pay.bka.sh/v1.2.0-beta
                    </code>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-4">
                <Button 
                  className="btn-primary"
                  onClick={handleSaveBkash} 
                  disabled={isSaving === 'bkash'}
                >
                  {isSaving === 'bkash' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Configuration'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Nagad */}
        <TabsContent value="nagad">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Nagad Payment Gateway</CardTitle>
                  <CardDescription>Configure Nagad payment integration</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={nagadForm.enabled}
                    onCheckedChange={(checked) => setNagadForm({ ...nagadForm, enabled: checked })}
                  />
                  <span className="text-sm">{nagadForm.enabled ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch checked={nagadForm.sandbox} onCheckedChange={(checked) => setNagadForm({ ...nagadForm, sandbox: checked })} />
                <span className="text-sm">Sandbox Mode</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Merchant ID</Label>
                  <Input type="password" placeholder="Enter Merchant ID" value={nagadForm.merchantId} onChange={(e) => setNagadForm({ ...nagadForm, merchantId: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Merchant Number</Label>
                  <Input placeholder="Enter Merchant Number" value={nagadForm.merchantNumber} onChange={(e) => setNagadForm({ ...nagadForm, merchantNumber: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Public Key</Label>
                  <Input type="password" placeholder="Enter Public Key" value={nagadForm.publicKey} onChange={(e) => setNagadForm({ ...nagadForm, publicKey: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Private Key</Label>
                  <Input type="password" placeholder="Enter Private Key" value={nagadForm.privateKey} onChange={(e) => setNagadForm({ ...nagadForm, privateKey: e.target.value })} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
                Nagad integration coming soon. This is a placeholder for the configuration.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PipraPay */}
        <TabsContent value="piprapay">
          <div className="space-y-6">
            {/* Main Configuration Card */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      PipraPay Payment Gateway
                    </CardTitle>
                    <CardDescription>
                      Self-hosted payment automation platform for Bangladesh
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={pipraPayForm.isEnabled}
                        onCheckedChange={(checked) => setPipraPayForm({ ...pipraPayForm, isEnabled: checked })}
                      />
                      <span className="text-sm font-medium">{pipraPayForm.isEnabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status Badge */}
                <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : pipraPayForm.isEnabled ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">
                      {isLoading ? 'Loading...' : pipraPayForm.isEnabled ? 'Gateway Active' : 'Gateway Inactive'}
                    </span>
                  </div>
                  <Badge variant={pipraPayForm.isSandbox ? 'secondary' : 'default'}>
                    {pipraPayForm.isSandbox ? 'Sandbox Mode' : 'Production Mode'}
                  </Badge>
                </div>

                {/* Mode Toggle */}
                <div className="flex flex-wrap items-center justify-between p-4 border rounded-lg gap-4">
                  <div>
                    <Label className="font-semibold">Sandbox Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable for testing. Disable for production payments.
                    </p>
                  </div>
                  <Switch
                    checked={pipraPayForm.isSandbox}
                    onCheckedChange={(checked) => setPipraPayForm({ ...pipraPayForm, isSandbox: checked })}
                  />
                </div>

                {/* API Configuration */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    API Configuration
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Get your API credentials from PipraPay dashboard.{' '}
                    <a 
                      href="https://piprapay.readme.io/reference/overview" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      View Documentation
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* API Key */}
                    <div className="space-y-2">
                      <Label htmlFor="piprapay-apiKey">API Key</Label>
                      <div className="relative">
                        <Input
                          id="piprapay-apiKey"
                          type={showCredentials['piprapay-apiKey'] ? 'text' : 'password'}
                          value={pipraPayForm.apiKey}
                          onChange={(e) => setPipraPayForm({ ...pipraPayForm, apiKey: e.target.value })}
                          placeholder="Enter your API Key"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => toggleShowCredential('piprapay-apiKey')}
                        >
                          {showCredentials['piprapay-apiKey'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Base URL */}
                    <div className="space-y-2">
                      <Label htmlFor="piprapay-baseUrl">Base URL</Label>
                      <Input
                        id="piprapay-baseUrl"
                        value={pipraPayForm.baseUrl}
                        onChange={(e) => setPipraPayForm({ ...pipraPayForm, baseUrl: e.target.value })}
                        placeholder={pipraPayForm.isSandbox ? "https://sandbox.piprapay.com" : "https://pay.yourdomain.com"}
                      />
                      {pipraPayForm.isSandbox && (
                        <p className="text-xs text-muted-foreground">
                          Sandbox URL: https://sandbox.piprapay.com
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* URL Configuration */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    URL Configuration
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Redirect URL */}
                    <div className="space-y-2">
                      <Label htmlFor="piprapay-redirectUrl">Success Redirect URL</Label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="piprapay-redirectUrl"
                          value={pipraPayForm.redirectUrl}
                          onChange={(e) => setPipraPayForm({ ...pipraPayForm, redirectUrl: e.target.value })}
                          placeholder="https://yoursite.com/payment/success"
                          className="pl-9"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">User redirected here after successful payment</p>
                    </div>

                    {/* Cancel URL */}
                    <div className="space-y-2">
                      <Label htmlFor="piprapay-cancelUrl">Cancel URL</Label>
                      <div className="relative">
                        <XCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="piprapay-cancelUrl"
                          value={pipraPayForm.cancelUrl}
                          onChange={(e) => setPipraPayForm({ ...pipraPayForm, cancelUrl: e.target.value })}
                          placeholder="https://yoursite.com/payment/cancel"
                          className="pl-9"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">User redirected here if payment cancelled</p>
                    </div>

                    {/* Webhook URL */}
                    <div className="space-y-2">
                      <Label htmlFor="piprapay-webhookUrl">Webhook URL (IPN)</Label>
                      <div className="relative">
                        <Webhook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="piprapay-webhookUrl"
                          value={pipraPayForm.webhookUrl}
                          onChange={(e) => setPipraPayForm({ ...pipraPayForm, webhookUrl: e.target.value })}
                          placeholder="https://yoursite.com/api/webhook/piprapay"
                          className="pl-9"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">For server-to-server notifications</p>
                    </div>
                  </div>
                </div>

                {/* Additional Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="piprapay-currency">Currency</Label>
                    <Select
                      value={pipraPayForm.currency}
                      onValueChange={(value) => setPipraPayForm({ ...pipraPayForm, currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BDT">BDT - Bangladeshi Taka</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="piprapay-returnType">Return Type</Label>
                    <Select
                      value={pipraPayForm.returnType}
                      onValueChange={(value) => setPipraPayForm({ ...pipraPayForm, returnType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Return Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">How payment data is sent to redirect URL</p>
                  </div>
                </div>

                {/* API Endpoints Reference */}
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    API Endpoints Reference
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Sandbox Base URL:</span>
                      <code className="block bg-background px-2 py-1 rounded text-xs">
                        https://sandbox.piprapay.com
                      </code>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Create Charge:</span>
                      <code className="block bg-background px-2 py-1 rounded text-xs">
                        POST /api/create-charge
                      </code>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Verify Payment:</span>
                      <code className="block bg-background px-2 py-1 rounded text-xs">
                        POST /api/verify-payments
                      </code>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Auth Header:</span>
                      <code className="block bg-background px-2 py-1 rounded text-xs">
                        mh-piprapay-api-key
                      </code>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-2 flex-wrap">
                    <a 
                      href="https://piprapay.readme.io/reference/create-charge" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs inline-flex items-center gap-1"
                    >
                      Create Charge Docs <ExternalLink className="w-3 h-3" />
                    </a>
                    <a 
                      href="https://piprapay.readme.io/reference/verify-payments" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs inline-flex items-center gap-1"
                    >
                      Verify Payment Docs <ExternalLink className="w-3 h-3" />
                    </a>
                    <a 
                      href="https://piprapay.readme.io/reference/validate-webhook" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs inline-flex items-center gap-1"
                    >
                      Webhook Docs <ExternalLink className="w-3 h-3" />
                    </a>
                    <a 
                      href="https://piprapay.readme.io/reference/redirect-checkout" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs inline-flex items-center gap-1"
                    >
                      Redirect Checkout <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-4">
                  <Button 
                    className="btn-primary"
                    onClick={handleSavePipraPay} 
                    disabled={isSaving === 'piprapay'}
                  >
                    {isSaving === 'piprapay' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Configuration'
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleTestPipraPay} 
                    disabled={isTesting === 'piprapay' || !pipraPayForm.apiKey}
                  >
                    {isTesting === 'piprapay' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Test Connection
                      </>
                    )}
                  </Button>
                </div>

                {/* Test Result */}
                {testResult && isTesting === null && (
                  <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    <div className="flex items-center gap-2">
                      {testResult.success ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                      <span className="font-medium">{testResult.message}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Create Charge Request Example */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Create Charge Request Example
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto text-xs">
{`{
  "full_name": "Customer Name",
  "email_mobile": "customer@email.com",
  "amount": "100",
  "metadata": {
    "order_id": "ORDER_123"
  },
  "redirect_url": "` + (pipraPayForm.redirectUrl || 'https://yoursite.com/success') + `",
  "return_type": "` + pipraPayForm.returnType + `",
  "cancel_url": "` + (pipraPayForm.cancelUrl || 'https://yoursite.com/cancel') + `",
  "webhook_url": "` + (pipraPayForm.webhookUrl || 'https://yoursite.com/webhook') + `",
  "currency": "` + pipraPayForm.currency + `"
}`}
                </pre>
                <p className="text-xs text-muted-foreground mt-2">
                  Response includes identifiers sent to your redirect_url and webhook_url. Use <code className="bg-muted px-1 rounded">pp_id</code> to verify payment.
                </p>
              </CardContent>
            </Card>

            {/* Webhook Payload Example */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Webhook className="w-4 h-4" />
                  Webhook Payload Example
                </CardTitle>
                <CardDescription>
                  Validate the <code>mh-piprapay-api-key</code> header on each webhook
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto text-xs">
{`{
  "pp_id": "181055228",
  "customer_name": "Demo",
  "customer_email_mobile": "demo@gmail.com",
  "payment_method": "bKash Personal",
  "amount": "10",
  "fee": "0",
  "total": 10,
  "currency": "BDT",
  "metadata": { "order_id": "ORDER_123" },
  "sender_number": "568568568",
  "transaction_id": "TXN123456",
  "status": "completed",
  "date": "2025-06-26 13:34:13"
}`}
                </pre>
                <p className="text-xs text-muted-foreground mt-2">
                  Always verify the payment using <code className="bg-muted px-1 rounded">POST /api/verify-payments</code> with the <code className="bg-muted px-1 rounded">pp_id</code>
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}

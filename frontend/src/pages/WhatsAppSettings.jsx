import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { ClipboardDocumentCheckIcon, ClipboardDocumentIcon, InformationCircleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const WhatsAppSettings = () => {
  const [activeTab, setActiveTab] = useState('botbiz');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [testStatus, setTestStatus] = useState(null);
  const [settings, setSettings] = useState({
    botbiz: {
      apiKey: '',
      phoneNumber: '',
      verifyToken: '',
      enabled: false
    },
    twilio: {
      accountSid: '',
      authToken: '',
      phoneNumber: '',
      enabled: false
    },
    threeSixtyDialog: {
      apiKey: '',
      phoneNumberId: '',
      enabled: false
    },
    meta: {
      appId: '',
      appSecret: '',
      phoneNumberId: '',
      accessToken: '',
      webhookVerifyToken: '',
      enabled: false
    }
  });
  
  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/settings/whatsapp');
        setSettings(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching WhatsApp settings:', error);
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);
  
  const handleInputChange = (provider, field, value) => {
    setSettings(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };
  
  const handleToggleProvider = (provider) => {
    setSettings(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        enabled: !prev[provider].enabled
      }
    }));
  };
  
  const saveSettings = async (provider) => {
    try {
      setSaveStatus({ loading: true });
      
      // In a real app, you would encrypt sensitive data like auth tokens
      await axios.post('/api/settings/whatsapp', {
        provider,
        data: settings[provider]
      });
      
      setSaveStatus({ success: true, message: 'Settings saved successfully!' });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    } catch (error) {
      console.error('Error saving WhatsApp settings:', error);
      setSaveStatus({ 
        error: true, 
        message: error.response?.data?.message || 'Failed to save settings. Please try again.' 
      });
    }
  };
  
  const testWhatsApp = async (provider) => {
    try {
      setTestStatus({ loading: true });
      
      await axios.post('/api/settings/whatsapp/test', {
        provider,
        phoneNumber: settings[provider].phoneNumber || settings[provider].phoneNumberId
      });
      
      setTestStatus({ success: true, message: 'Test message sent successfully!' });
      
      // Clear test status after 3 seconds
      setTimeout(() => {
        setTestStatus(null);
      }, 3000);
    } catch (error) {
      console.error('Error testing WhatsApp:', error);
      setTestStatus({ 
        error: true, 
        message: error.response?.data?.message || 'Failed to send test message. Please check your settings.' 
      });
    }
  };
  
  const copyWebhookUrl = (webhookType) => {
    const baseUrl = window.location.origin.replace('3000', '5000'); // Assuming backend runs on port 5000
    let webhookUrl = '';
    
    if (webhookType === 'botbiz') {
      webhookUrl = `${baseUrl}/api/whatsapp/botbiz`;
    } else if (webhookType === 'twilio') {
      webhookUrl = `${baseUrl}/api/whatsapp/twilio`;
    } else if (webhookType === '360dialog') {
      webhookUrl = `${baseUrl}/api/whatsapp/360dialog`;
    } else if (webhookType === 'meta') {
      webhookUrl = `${baseUrl}/api/whatsapp/meta`;
    }
    
    navigator.clipboard.writeText(webhookUrl);
    
    // Show a temporary notice
    const element = document.getElementById(`copy-${webhookType}`);
    if (element) {
      element.textContent = 'Copied!';
      setTimeout(() => {
        element.textContent = 'Copy';
      }, 2000);
    }
  };
  
  // Render form based on active tab
  const renderForm = () => {
    if (activeTab === 'botbiz') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h3 className="text-lg font-medium">BotBiz Configuration</h3>
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${settings.botbiz.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {settings.botbiz.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={settings.botbiz.enabled}
                onChange={() => handleToggleProvider('botbiz')}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <div className="flex">
              <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
              <div>
                <h4 className="text-blue-800 font-medium">BotBiz Webhook Configuration</h4>
                <p className="text-blue-700 text-sm mt-1">
                  Your BotBiz webhook is already configured. This URL is for reference only:
                </p>
                <div className="flex items-center mt-2">
                  <code className="bg-white px-3 py-1 text-sm rounded border border-blue-200 flex-grow">
                    {window.location.origin.replace('3000', '5000')}/api/whatsapp/botbiz
                  </code>
                  <button
                    type="button"
                    onClick={() => copyWebhookUrl('botbiz')}
                    className="ml-2 text-blue-700 hover:text-blue-800 text-sm flex items-center"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                    <span id="copy-botbiz">Copy</span>
                  </button>
                </div>
                <p className="text-blue-700 text-sm mt-2">
                  Your BotBiz webhook is already configured at: <code className="bg-white px-2 py-0.5 text-sm rounded border border-blue-200">https://dash.botbiz.io/webhook/whatsapp-webhook</code>
                </p>
                <p className="text-blue-700 text-sm mt-1">
                  Verify Token: <code className="bg-white px-2 py-0.5 text-sm rounded border border-blue-200">8450385012773603920</code>
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your BotBiz API Key"
                value={settings.botbiz.apiKey}
                onChange={(e) => handleInputChange('botbiz', 'apiKey', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp Phone Number
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your WhatsApp phone number"
                value={settings.botbiz.phoneNumber}
                onChange={(e) => handleInputChange('botbiz', 'phoneNumber', e.target.value)}
              />
              <p className="mt-1 text-sm text-gray-500">
                Format: Include country code without + (e.g., 911234567890)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook Verify Token
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="8450385012773603920 (Automatically configured)"
                value={settings.botbiz.verifyToken || '8450385012773603920'}
                onChange={(e) => handleInputChange('botbiz', 'verifyToken', e.target.value)}
                disabled
              />
              <p className="mt-1 text-sm text-gray-500">
                This token has been automatically configured and is ready to use.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => testWhatsApp('botbiz')}
              disabled={!settings.botbiz.enabled || testStatus?.loading}
            >
              {testStatus?.loading ? 'Sending...' : 'Test Connection'}
            </button>
            <button
              type="button"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => saveSettings('botbiz')}
              disabled={saveStatus?.loading}
            >
              {saveStatus?.loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      );
    } else if (activeTab === 'twilio') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h3 className="text-lg font-medium">Twilio Configuration</h3>
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${settings.twilio.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {settings.twilio.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={settings.twilio.enabled}
                onChange={() => handleToggleProvider('twilio')}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <div className="flex">
              <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
              <div>
                <h4 className="text-blue-800 font-medium">Webhook URL for Twilio</h4>
                <p className="text-blue-700 text-sm mt-1">
                  Configure your Twilio WhatsApp Sandbox with this webhook URL:
                </p>
                <div className="flex items-center mt-2">
                  <code className="bg-white px-3 py-1 text-sm rounded border border-blue-200 flex-grow">
                    {window.location.origin.replace('3000', '5000')}/api/whatsapp/twilio
                  </code>
                  <button
                    type="button"
                    onClick={() => copyWebhookUrl('twilio')}
                    className="ml-2 text-blue-700 hover:text-blue-800 text-sm flex items-center"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                    <span id="copy-twilio">Copy</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account SID
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your Twilio Account SID"
                value={settings.twilio.accountSid}
                onChange={(e) => handleInputChange('twilio', 'accountSid', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Auth Token
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your Twilio Auth Token"
                value={settings.twilio.authToken}
                onChange={(e) => handleInputChange('twilio', 'authToken', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp Phone Number
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your Twilio WhatsApp number"
                value={settings.twilio.phoneNumber}
                onChange={(e) => handleInputChange('twilio', 'phoneNumber', e.target.value)}
              />
              <p className="mt-1 text-sm text-gray-500">
                Format: Include country code without + (e.g., 911234567890)
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => testWhatsApp('twilio')}
              disabled={!settings.twilio.enabled || testStatus?.loading}
            >
              {testStatus?.loading ? 'Sending...' : 'Test Connection'}
            </button>
            <button
              type="button"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => saveSettings('twilio')}
              disabled={saveStatus?.loading}
            >
              {saveStatus?.loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      );
    } else if (activeTab === '360dialog') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h3 className="text-lg font-medium">360dialog Configuration</h3>
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${settings.threeSixtyDialog.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {settings.threeSixtyDialog.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={settings.threeSixtyDialog.enabled}
                onChange={() => handleToggleProvider('threeSixtyDialog')}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <div className="flex">
              <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
              <div>
                <h4 className="text-blue-800 font-medium">Webhook URL for 360dialog</h4>
                <p className="text-blue-700 text-sm mt-1">
                  Configure your 360dialog Business API with this webhook URL:
                </p>
                <div className="flex items-center mt-2">
                  <code className="bg-white px-3 py-1 text-sm rounded border border-blue-200 flex-grow">
                    {window.location.origin.replace('3000', '5000')}/api/whatsapp/360dialog
                  </code>
                  <button
                    type="button"
                    onClick={() => copyWebhookUrl('360dialog')}
                    className="ml-2 text-blue-700 hover:text-blue-800 text-sm flex items-center"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                    <span id="copy-360dialog">Copy</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your 360dialog API Key"
                value={settings.threeSixtyDialog.apiKey}
                onChange={(e) => handleInputChange('threeSixtyDialog', 'apiKey', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number ID
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your WhatsApp Phone Number ID"
                value={settings.threeSixtyDialog.phoneNumberId}
                onChange={(e) => handleInputChange('threeSixtyDialog', 'phoneNumberId', e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => testWhatsApp('threeSixtyDialog')}
              disabled={!settings.threeSixtyDialog.enabled || testStatus?.loading}
            >
              {testStatus?.loading ? 'Sending...' : 'Test Connection'}
            </button>
            <button
              type="button"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => saveSettings('threeSixtyDialog')}
              disabled={saveStatus?.loading}
            >
              {saveStatus?.loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      );
    } else if (activeTab === 'meta') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h3 className="text-lg font-medium">Meta (Facebook) Configuration</h3>
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${settings.meta.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {settings.meta.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={settings.meta.enabled}
                onChange={() => handleToggleProvider('meta')}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <div className="flex">
              <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
              <div>
                <h4 className="text-blue-800 font-medium">Webhook URL for Meta</h4>
                <p className="text-blue-700 text-sm mt-1">
                  Configure your Meta WhatsApp Business API with this webhook URL:
                </p>
                <div className="flex items-center mt-2">
                  <code className="bg-white px-3 py-1 text-sm rounded border border-blue-200 flex-grow">
                    {window.location.origin.replace('3000', '5000')}/api/whatsapp/meta
                  </code>
                  <button
                    type="button"
                    onClick={() => copyWebhookUrl('meta')}
                    className="ml-2 text-blue-700 hover:text-blue-800 text-sm flex items-center"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                    <span id="copy-meta">Copy</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                App ID
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your Meta App ID"
                value={settings.meta.appId}
                onChange={(e) => handleInputChange('meta', 'appId', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                App Secret
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your Meta App Secret"
                value={settings.meta.appSecret}
                onChange={(e) => handleInputChange('meta', 'appSecret', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number ID
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your WhatsApp Phone Number ID"
                value={settings.meta.phoneNumberId}
                onChange={(e) => handleInputChange('meta', 'phoneNumberId', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Token
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your Permanent Access Token"
                value={settings.meta.accessToken}
                onChange={(e) => handleInputChange('meta', 'accessToken', e.target.value)}
              />
              <p className="mt-1 text-sm text-gray-500">
                This is your long-lived access token for the WhatsApp API
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook Verify Token
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your Webhook Verify Token"
                value={settings.meta.webhookVerifyToken}
                onChange={(e) => handleInputChange('meta', 'webhookVerifyToken', e.target.value)}
              />
              <p className="mt-1 text-sm text-gray-500">
                This is a custom string you choose to verify webhook calls
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => testWhatsApp('meta')}
              disabled={!settings.meta.enabled || testStatus?.loading}
            >
              {testStatus?.loading ? 'Sending...' : 'Test Connection'}
            </button>
            <button
              type="button"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => saveSettings('meta')}
              disabled={saveStatus?.loading}
            >
              {saveStatus?.loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      );
    }
  };
  
  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">WhatsApp Integration Settings</h1>
        
        {/* Status messages */}
        {saveStatus?.success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4 flex">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-green-700">{saveStatus.message}</span>
          </div>
        )}
        
        {saveStatus?.error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4 flex">
            <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{saveStatus.message}</span>
          </div>
        )}
        
        {testStatus?.success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4 flex">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-green-700">{testStatus.message}</span>
          </div>
        )}
        
        {testStatus?.error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4 flex">
            <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{testStatus.message}</span>
          </div>
        )}
        
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex" aria-label="Tabs">
              <button
                className={`${
                  activeTab === 'botbiz'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                onClick={() => setActiveTab('botbiz')}
              >
                BotBiz
              </button>
              <button
                className={`${
                  activeTab === 'twilio'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                onClick={() => setActiveTab('twilio')}
              >
                Twilio
              </button>
              <button
                className={`${
                  activeTab === '360dialog'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                onClick={() => setActiveTab('360dialog')}
              >
                360dialog
              </button>
              <button
                className={`${
                  activeTab === 'meta'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                onClick={() => setActiveTab('meta')}
              >
                Meta (Facebook)
              </button>
            </nav>
          </div>
          
          {/* Form */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading settings...</p>
              </div>
            ) : (
              renderForm()
            )}
          </div>
        </div>
        
        {/* Help Section */}
        <div className="mt-8 bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">How to Set Up WhatsApp Integration</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-800">Twilio Setup</h3>
                <ol className="mt-2 ml-5 list-decimal text-gray-600 space-y-2">
                  <li>Sign up for a Twilio account at <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">twilio.com</a></li>
                  <li>Navigate to the WhatsApp Sandbox in your Twilio console</li>
                  <li>Copy your Account SID and Auth Token from the dashboard</li>
                  <li>Set up your WhatsApp Sandbox by sending a join message to the provided number</li>
                  <li>Configure the webhook URL in your Twilio WhatsApp Sandbox settings</li>
                  <li>Enable Twilio in the settings above and save your configuration</li>
                </ol>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-800">360dialog Setup</h3>
                <ol className="mt-2 ml-5 list-decimal text-gray-600 space-y-2">
                  <li>Create an account on <a href="https://www.360dialog.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">360dialog.com</a></li>
                  <li>Request access to the WhatsApp Business API</li>
                  <li>Once approved, get your API key from the 360dialog dashboard</li>
                  <li>Configure the webhook URL in your 360dialog partner center</li>
                  <li>Enable 360dialog in the settings above and save your configuration</li>
                </ol>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-800">Meta (Facebook) Setup</h3>
                <ol className="mt-2 ml-5 list-decimal text-gray-600 space-y-2">
                  <li>Create a Meta for Developers account at <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">developers.facebook.com</a></li>
                  <li>Create a Meta App in the Meta for Developers console</li>
                  <li>Request access to the WhatsApp Business API and set up a business profile</li>
                  <li>Register your phone number and go through the verification process</li>
                  <li>Set up webhook subscriptions with the URL provided above</li>
                  <li>Generate a permanent access token for the WhatsApp API</li>
                  <li>Enable Meta in the settings above and save your configuration</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WhatsAppSettings; 
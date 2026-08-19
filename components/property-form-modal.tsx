'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Upload } from 'lucide-react';

const OFFICE_SPACE_OPTIONS = [
  { id: 'regular-office', name: 'Regular Office', area: '24-66 sqm' },
  { id: 'compound-office', name: 'Compound of Offices', area: '150-245 sqm' },
];

const COMMERCIAL_OPTIONS = [
  { id: 'retail-unit', name: 'Retail Unit', area: 'Ground Floor' },
  { id: 'restaurant-fnb', name: 'Restaurant / F&B', area: 'Ground Floor' },
];

interface DeveloperProperty {
  id?: number;
  developer_name?: string;
  developer_email?: string;
  developer_phone?: string;
  title: string;
  description?: string;
  listing_type: string;
  property_type: string;
  status: string;
  price?: number;
  price_per_month?: number;
  address: string;
  city: string;
  state?: string;
  zip_code?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  office_space_name?: string;
  office_space_type?: string;
  office_area?: number;
  commercial_name?: string;
  commercial_type?: string;
  commercial_area?: number;
  images?: string[];
  videos?: string[];
  thumbnail?: string;
  priority?: number;
}

interface PropertyFormModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  property?: DeveloperProperty;
  developerName?: string;
  developerEmail?: string;
  developerPhone?: string;
  onClose: () => void;
  onSubmit: (data: DeveloperProperty) => Promise<void> | void;
}

export function PropertyFormModal({
  isOpen,
  isLoading = false,
  property,
  developerName = '',
  developerEmail = '',
  developerPhone = '',
  onClose,
  onSubmit,
}: PropertyFormModalProps) {
  const isEditing = !!property?.id;
  
  const [formData, setFormData] = useState<DeveloperProperty>({
    developer_name: developerName,
    developer_email: developerEmail,
    developer_phone: developerPhone,
    title: '',
    listing_type: 'sale',
    property_type: 'residential',
    status: 'active',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    images: [],
    videos: [],
  });

  const [showOfficeManualInput, setShowOfficeManualInput] = useState(false);
  const [showCommercialManualInput, setShowCommercialManualInput] = useState(false);

  useEffect(() => {
    if (property) {
      setFormData(property);
      setShowOfficeManualInput(property.office_space_type === 'other');
      setShowCommercialManualInput(property.commercial_type === 'other');
    } else {
      setFormData((prev) => ({
        ...prev,
        developer_name: developerName,
        developer_email: developerEmail,
        developer_phone: developerPhone,
      }));
    }
  }, [property, developerName, developerEmail, developerPhone, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOfficeSpaceChange = (value: string) => {
    if (value === 'other') {
      setShowOfficeManualInput(true);
      setFormData((prev) => ({
        ...prev,
        office_space_name: '',
        office_space_type: 'other',
      }));
    } else {
      setShowOfficeManualInput(false);
      const option = OFFICE_SPACE_OPTIONS.find((o) => o.id === value);
      setFormData((prev) => ({
        ...prev,
        office_space_name: option?.name || '',
        office_space_type: value,
      }));
    }
  };

  const handleCommercialChange = (value: string) => {
    if (value === 'other') {
      setShowCommercialManualInput(true);
      setFormData((prev) => ({
        ...prev,
        commercial_name: '',
        commercial_type: 'other',
      }));
    } else {
      setShowCommercialManualInput(false);
      const option = COMMERCIAL_OPTIONS.find((o) => o.id === value);
      setFormData((prev) => ({
        ...prev,
        commercial_name: option?.name || '',
        commercial_type: value,
      }));
    }
  };

  const addImage = () => {
    setFormData((prev) => ({
      ...prev,
      images: [...(prev.images || []), ''],
    }));
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || [],
    }));
  };

  const updateImage = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images?.map((img, i) => (i === index ? value : img)) || [],
    }));
  };

  const addVideo = () => {
    setFormData((prev) => ({
      ...prev,
      videos: [...(prev.videos || []), ''],
    }));
  };

  const removeVideo = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      videos: prev.videos?.filter((_, i) => i !== index) || [],
    }));
  };

  const updateVideo = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      videos: prev.videos?.map((vid, i) => (i === index ? value : vid)) || [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('[v0] Error submitting form:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-2xl">
            {isEditing ? 'Edit Property' : 'Create New Property'}
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Fill in the property information below. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <form id="property-form" onSubmit={handleSubmit} className="space-y-8 p-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8 h-12">
                <TabsTrigger value="basic" className="text-sm font-medium">Basic Info</TabsTrigger>
                <TabsTrigger value="location" className="text-sm font-medium">Location</TabsTrigger>
                <TabsTrigger value="details" className="text-sm font-medium">Details</TabsTrigger>
                <TabsTrigger value="media" className="text-sm font-medium">Media</TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-6 mt-0">
              <div>
                <Label htmlFor="title" className="text-sm font-semibold mb-2 block">Property Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Modern 2-Bedroom Apartment"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="h-10 text-base"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-semibold mb-2 block">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your property..."
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  rows={5}
                  className="text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="property_type" className="text-sm font-semibold mb-2 block">Property Type *</Label>
                  <Select
                    value={formData.property_type}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        property_type: value,
                      }))
                    }
                  >
                    <SelectTrigger id="property_type" className="h-10 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="office_space">Office Space</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="listing_type" className="text-sm font-semibold mb-2 block">Listing Type *</Label>
                  <Select
                    value={formData.listing_type}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        listing_type: value,
                      }))
                    }
                  >
                    <SelectTrigger id="listing_type" className="h-10 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">For Sale</SelectItem>
                      <SelectItem value="rent">For Rent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="price" className="text-sm font-semibold mb-2 block">
                    {formData.listing_type === 'sale' ? 'Price *' : 'Price per Month *'}
                  </Label>
                  <Input
                    id="price"
                    name={formData.listing_type === 'sale' ? 'price' : 'price_per_month'}
                    type="number"
                    placeholder="0"
                    className="h-10 text-base"
                    value={
                      formData.listing_type === 'sale'
                        ? formData.price || ''
                        : formData.price_per_month || ''
                    }
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || undefined;
                      if (formData.listing_type === 'sale') {
                        setFormData((prev) => ({ ...prev, price: value }));
                      } else {
                        setFormData((prev) => ({ ...prev, price_per_month: value }));
                      }
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="status" className="text-sm font-semibold mb-2 block">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: value,
                      }))
                    }
                  >
                    <SelectTrigger id="status" className="h-10 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Location Tab */}
            <TabsContent value="location" className="space-y-6 mt-0">
              <div>
                <Label htmlFor="address" className="text-sm font-semibold mb-2 block">Street Address *</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="e.g., 123 Main St"
                  className="h-10 text-base"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="city" className="text-sm font-semibold mb-2 block">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="City"
                    className="h-10 text-base"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="state" className="text-sm font-semibold mb-2 block">State/Province</Label>
                  <Input
                    id="state"
                    name="state"
                    placeholder="State"
                    className="h-10 text-base"
                    value={formData.state || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="zip_code" className="text-sm font-semibold mb-2 block">ZIP/Postal Code</Label>
                <Input
                  id="zip_code"
                  name="zip_code"
                  placeholder="ZIP Code"
                  className="h-10 text-base"
                  value={formData.zip_code || ''}
                  onChange={handleInputChange}
                />
              </div>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4">
              {formData.property_type === 'residential' && (
                <>
                  <div>
                    <Label htmlFor="bedrooms">Number of Bedrooms</Label>
                    <Input
                      id="bedrooms"
                      name="bedrooms"
                      type="number"
                      placeholder="e.g., 2"
                      value={formData.bedrooms || ''}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || undefined;
                        setFormData((prev) => ({ ...prev, bedrooms: value }));
                      }}
                      min="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bathrooms">Number of Bathrooms</Label>
                    <Input
                      id="bathrooms"
                      name="bathrooms"
                      type="number"
                      placeholder="e.g., 1"
                      value={formData.bathrooms || ''}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || undefined;
                        setFormData((prev) => ({ ...prev, bathrooms: value }));
                      }}
                      min="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="area">Area (sqm)</Label>
                    <Input
                      id="area"
                      name="area"
                      type="number"
                      placeholder="e.g., 100"
                      value={formData.area || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || undefined;
                        setFormData((prev) => ({ ...prev, area: value }));
                      }}
                      min="0"
                    />
                  </div>
                </>
              )}

              {formData.property_type === 'office_space' && (
                <>
                  <div>
                    <Label htmlFor="office_space_type">Office Space Type</Label>
                    <Select
                      value={formData.office_space_type || ''}
                      onValueChange={handleOfficeSpaceChange}
                    >
                      <SelectTrigger id="office_space_type">
                        <SelectValue placeholder="Select office type" />
                      </SelectTrigger>
                      <SelectContent>
                        {OFFICE_SPACE_OPTIONS.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.name} ({option.area})
                          </SelectItem>
                        ))}
                        <SelectItem value="other">Other (Manual Entry)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {showOfficeManualInput && (
                    <div>
                      <Label htmlFor="office_space_name">Office Space Name</Label>
                      <Input
                        id="office_space_name"
                        name="office_space_name"
                        placeholder="Enter custom office space name"
                        value={formData.office_space_name || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="office_area">Area (sqm)</Label>
                    <Input
                      id="office_area"
                      name="office_area"
                      type="number"
                      placeholder="e.g., 150"
                      value={formData.office_area || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || undefined;
                        setFormData((prev) => ({ ...prev, office_area: value }));
                      }}
                      min="0"
                    />
                  </div>
                </>
              )}

              {formData.property_type === 'commercial' && (
                <>
                  <div>
                    <Label htmlFor="commercial_type">Commercial Type</Label>
                    <Select
                      value={formData.commercial_type || ''}
                      onValueChange={handleCommercialChange}
                    >
                      <SelectTrigger id="commercial_type">
                        <SelectValue placeholder="Select commercial type" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMERCIAL_OPTIONS.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.name} ({option.area})
                          </SelectItem>
                        ))}
                        <SelectItem value="other">Other (Manual Entry)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {showCommercialManualInput && (
                    <div>
                      <Label htmlFor="commercial_name">Commercial Name</Label>
                      <Input
                        id="commercial_name"
                        name="commercial_name"
                        placeholder="Enter custom commercial name"
                        value={formData.commercial_name || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="commercial_area">Area (sqm)</Label>
                    <Input
                      id="commercial_area"
                      name="commercial_area"
                      type="number"
                      placeholder="e.g., 100"
                      value={formData.commercial_area || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || undefined;
                        setFormData((prev) => ({ ...prev, commercial_area: value }));
                      }}
                      min="0"
                    />
                  </div>
                </>
              )}
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="space-y-4">
              {/* Images Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label>Images</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addImage}
                  >
                    Add Image
                  </Button>
                </div>

                <div className="space-y-2">
                  {(formData.images || []).map((image, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Image URL or path"
                        value={image}
                        onChange={(e) => updateImage(index, e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeImage(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Videos Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label>Videos</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addVideo}
                  >
                    Add Video
                  </Button>
                </div>

                <div className="space-y-2">
                  {(formData.videos || []).map((video, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Video URL or path"
                        value={video}
                        onChange={(e) => updateVideo(index, e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVideo(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="thumbnail">Thumbnail URL</Label>
                <Input
                  id="thumbnail"
                  name="thumbnail"
                  placeholder="Thumbnail image URL"
                  value={formData.thumbnail || ''}
                  onChange={handleInputChange}
                />
              </div>
            </TabsContent>
            </Tabs>
          </form>
        </div>

        {/* Form Actions - Sticky Footer */}
        <div className="flex justify-end gap-4 px-6 py-4 border-t flex-shrink-0 bg-white">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" form="property-form" disabled={isLoading}>
            {isLoading && <Spinner className="mr-2 w-4 h-4" />}
            {isEditing ? 'Update Property' : 'Create Property'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

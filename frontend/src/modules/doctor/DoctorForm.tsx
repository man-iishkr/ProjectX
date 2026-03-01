import React, { useState, useEffect } from 'react';
import MapmyIndiaSearch from '../../components/MapmyIndiaSearch';
import HybridRouteSearch from '../../components/HybridRouteSearch';
import { getReverseGeoCode, getPlaceDetails } from '../../api/mappls.api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';
import { useHQs } from '../../hooks/useHQs';
import { useProducts } from '../../hooks/useProducts';
import { useCreateDoctor, useUpdateDoctor } from '../../hooks/useDoctors';

// Haversine formula to calculate distance (in km)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return parseFloat(d.toFixed(2));
};

const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
};

interface DoctorFormProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
    isModal?: boolean;
}

const DoctorForm: React.FC<DoctorFormProps> = ({ onClose, onSuccess, initialData, isModal = true }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        routeFrom: '',
        routeTo: '',
        date: new Date().toISOString().split('T')[0],
        area: '',
        speciality: '',
        products: [] as string[], // Array of Product IDs
        hq: user?.role === 'hq' ? user.hq : '',
        clinicAddress: '',
        city: '',
        state: '',
        pincode: '',
        residentialAddress: '',
        class: 'General',
        frequency: 1,
        mobile: '',
        phone: '',
        email: '',
        location: {
            type: 'Point',
            coordinates: [0, 0] // [lng, lat]
        },
        rejectedRemark: '',
        approvalStatus: 'Pending',
        distance: 0,
        dob: '',
        dom: ''
    });

    const { data: hqs } = useHQs();
    const { data: availableProducts } = useProducts();

    const createDoctorMutation = useCreateDoctor();
    const updateDoctorMutation = useUpdateDoctor();

    const [routeCoords, setRouteCoords] = useState<{
        from: { lat: number, lng: number } | null,
        to: { lat: number, lng: number } | null
    }>({ from: null, to: null });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...formData,
                ...initialData,
                hq: initialData.hq?._id || initialData.hq,
                products: initialData.products?.map((p: any) => p._id || p) || []
            });
        }
    }, [initialData]);

    useEffect(() => {
        if (routeCoords.from && routeCoords.to) {
            const dist = calculateDistance(routeCoords.from.lat, routeCoords.from.lng, routeCoords.to.lat, routeCoords.to.lng);
            setFormData(prev => ({ ...prev, distance: dist }));
        }
    }, [routeCoords]);

    const handleRouteSelect = async (type: 'from' | 'to', address: string, data: any) => {
        setFormData(prev => ({ ...prev, [type === 'from' ? 'routeFrom' : 'routeTo']: address }));

        // Try to get coords
        let lat = 0, lng = 0;
        if (data?.eLoc) {
            try {
                const details = await getPlaceDetails(data.eLoc);
                if (details) {
                    lat = parseFloat(details.latitude);
                    lng = parseFloat(details.longitude);
                }
            } catch (e) { console.error(e); }
        } else if (data?.latitude && data?.longitude) {
            lat = data.latitude;
            lng = data.longitude;
        }

        if (lat && lng) {
            setRouteCoords(prev => ({
                ...prev,
                [type]: { lat, lng }
            }));
        }
    };



    const handleLocationSelect = async (address: string, lat?: number, lng?: number) => {
        // State updates
        let newCity = formData.city;
        let newState = formData.state;
        let newPincode = formData.pincode;

        if (lat && lng) {
            // Auto-fill via Reverse Geocoding
            try {
                const details = await getReverseGeoCode(lat, lng);
                if (details) {
                    newCity = details.city || details.village || details.district || '';
                    newState = details.state || '';
                    newPincode = details.pincode || '';
                }
            } catch (e) {
                console.error('RevGeo Failed', e);
            }
        }

        setFormData(prev => ({
            ...prev,
            clinicAddress: address,
            city: newCity,
            state: newState,
            pincode: newPincode,
            location: (lat && lng) ? {
                type: 'Point',
                coordinates: [lng, lat]
            } : prev.location
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '');
        setFormData(prev => ({ ...prev, pincode: val }));

        if (val.length === 6) {
            try {
                const res = await fetch(`https://api.postalpincode.in/pincode/${val}`);
                const data = await res.json();
                if (data && data[0] && data[0].Status === 'Success') {
                    const postOffice = data[0].PostOffice[0];
                    setFormData(prev => ({
                        ...prev,
                        pincode: val,
                        city: postOffice.District,
                        state: postOffice.State
                    }));
                }
            } catch (err) {
                console.error("Pincode lookup failed", err);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (initialData) {
                await updateDoctorMutation.mutateAsync({ id: initialData._id, data: formData });
            } else {
                await createDoctorMutation.mutateAsync(formData);
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            const errorMsg = err.response?.data?.error || err.message || 'Failed to save doctor';
            alert(`Failed to save: \n${errorMsg}`);
        }
    };

    const formContent = (
        <div className={`w-full ${!isModal ? 'border shadow-sm p-6 rounded-lg bg-card' : ''}`}>
            <h2 className="text-xl font-bold mb-4">
                {initialData ? 'Edit Doctor' : 'Add Doctor'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Basic Info */}
                <div>
                    <label className="block text-sm font-medium mb-1">Dr Name *</label>
                    <input name="name" value={formData.name} onChange={handleChange} className="w-full border p-2 rounded bg-background text-foreground" required />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Dr Code</label>
                    <input name="code" value={formData.code} onChange={handleChange} className="w-full border p-2 rounded bg-background text-foreground" />
                </div>

                {/* Location */}
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">HQ *</label>
                        <select
                            name="hq"
                            value={formData.hq || (user?.role === 'hq' ? user.hq : '')}
                            onChange={handleChange}
                            className="w-full border p-2 rounded bg-background text-foreground disabled:bg-muted disabled:text-muted-foreground"
                            required
                            disabled={user?.role === 'hq'}
                        >
                            <option value="">Select HQ</option>
                            {(hqs || []).map((hq: any) => (
                                <option key={hq._id} value={hq._id}>{hq.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Date</label>
                        <input type="date" name="date" value={formData.date?.split('T')[0]} onChange={handleChange} className="w-full border p-2 rounded bg-background text-foreground" />
                    </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Date of Birth</label>
                        <input type="date" name="dob" value={formData.dob ? formData.dob.split('T')[0] : ''} onChange={handleChange} className="w-full border p-2 rounded bg-background text-foreground" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Date of Marriage</label>
                        <input type="date" name="dom" value={formData.dom ? formData.dom.split('T')[0] : ''} onChange={handleChange} className="w-full border p-2 rounded bg-background text-foreground" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Route From *</label>
                    <HybridRouteSearch
                        value={formData.routeFrom}
                        onChangeText={(text: string) => setFormData(prev => ({ ...prev, routeFrom: text }))}
                        onSelect={(addr: string, data: any) => handleRouteSelect('from', addr, data)}
                        placeholder="Start Point"
                        className="w-full"
                        hqId={formData.hq}
                        locationBias={
                            (hqs || []).find((h: any) => h._id === formData.hq)?.coordinates?.coordinates
                                ? `${(hqs || []).find((h: any) => h._id === formData.hq)?.coordinates.coordinates[1]},${(hqs || []).find((h: any) => h._id === formData.hq)?.coordinates.coordinates[0]}`
                                : undefined
                        }
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Route To *</label>
                    <HybridRouteSearch
                        value={formData.routeTo}
                        onChangeText={(text: string) => setFormData(prev => ({ ...prev, routeTo: text }))}
                        onSelect={(addr: string, data: any) => handleRouteSelect('to', addr, data)}
                        placeholder="End Point"
                        className="w-full"
                        hqId={formData.hq}
                        locationBias={
                            (hqs || []).find((h: any) => h._id === formData.hq)?.coordinates?.coordinates
                                ? `${(hqs || []).find((h: any) => h._id === formData.hq)?.coordinates.coordinates[1]},${(hqs || []).find((h: any) => h._id === formData.hq)?.coordinates.coordinates[0]}`
                                : undefined
                        }
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Area *</label>
                    <input name="area" value={formData.area} onChange={handleChange} className="w-full border p-2 rounded bg-background text-foreground" required />
                </div>

                {/* Professional Info */}
                <div>
                    <label className="block text-sm font-medium mb-1">Speciality *</label>
                    <input name="speciality" value={formData.speciality} onChange={handleChange} className="w-full border p-2 rounded bg-background text-foreground" required />
                </div>

                {/* Product Selection */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Promoted Products</label>
                    <div className="border rounded p-3 bg-background text-foreground/50">
                        <div className="flex flex-wrap gap-2 mb-2">
                            {formData.products.map(prodId => {
                                const prod = (availableProducts || []).find((p: any) => p._id === prodId);
                                return (
                                    <span key={prodId} className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-100 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                        {prod?.name || 'Unknown'}
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({
                                                ...prev,
                                                products: prev.products.filter(id => id !== prodId)
                                            }))}
                                            className="hover:text-blue-900 dark:hover:text-blue-50 font-bold"
                                        >
                                            ×
                                        </button>
                                    </span>
                                );
                            })}
                            {formData.products.length === 0 && <span className="text-muted-foreground text-sm">No products selected</span>}
                        </div>

                        <select
                            className="w-full border p-2 rounded bg-background text-foreground"
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val && !formData.products.includes(val)) {
                                    setFormData(prev => ({
                                        ...prev,
                                        products: [...prev.products, val]
                                    }));
                                }
                                e.target.value = ''; // Reset select
                            }}
                        >
                            <option value="">+ Add Product...</option>
                            {(availableProducts || [])
                                .filter((p: any) => !formData.products.includes(p._id))
                                .map((p: any) => (
                                    <option key={p._id} value={p._id}>{p.name}</option>
                                ))
                            }
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Class</label>
                    <select name="class" value={formData.class} onChange={handleChange} className="w-full border p-2 rounded bg-background text-foreground">
                        <option value="General">General</option>
                        <option value="Core">Core</option>
                        <option value="Super Core">Super Core</option>
                        <option value="Important">Important</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Frequency</label>
                    <input type="number" name="frequency" value={formData.frequency} onChange={handleChange} className="w-full border p-2 rounded bg-background text-foreground" min="1" />
                </div>

                {/* Contact - Addresses */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Clinic Address *</label>
                    <MapmyIndiaSearch
                        value={formData.clinicAddress}
                        onChangeText={(text: string) => setFormData(prev => ({ ...prev, clinicAddress: text }))}
                        onSelect={handleLocationSelect}
                        placeholder="Search Clinic Location..."
                        className="w-full"
                        locationBias={
                            (hqs || []).find((h: any) => h._id === formData.hq)?.coordinates?.coordinates
                                ? `${(hqs || []).find((h: any) => h._id === formData.hq)?.coordinates.coordinates[1]},${(hqs || []).find((h: any) => h._id === formData.hq)?.coordinates.coordinates[0]}`
                                : undefined
                        }
                    />
                    <div className="mt-2 flex items-center justify-between">
                        {/* Removed Location Capture Button per PRD */}
                        <div className="text-xs text-amber-600">
                            Location will be captured during first visit.
                        </div>
                    </div>
                </div>

                {/* Auto-filled Fields */}
                <div>
                    <label className="block text-sm font-medium mb-1">City</label>
                    <input name="city" value={formData.city} onChange={handleChange} className="w-full border p-2 rounded bg-background text-foreground" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">State</label>
                    <input name="state" value={formData.state} onChange={handleChange} className="w-full border p-2 rounded bg-background text-foreground" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Pincode</label>
                    <input name="pincode" value={formData.pincode} onChange={handlePincodeChange} maxLength={6} className="w-full border p-2 rounded bg-background text-foreground" />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Residential Address</label>
                    <input name="residentialAddress" value={formData.residentialAddress} onChange={handleChange} className="w-full border p-2 rounded bg-background text-foreground" />
                </div>

                {/* Contact - Phones */}
                <div>
                    <label className="block text-sm font-medium mb-1">Mobile *</label>
                    <input name="mobile" value={formData.mobile} onChange={handleChange} className="w-full border p-2 rounded bg-background text-foreground" required />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input name="phone" value={formData.phone} onChange={handleChange} className="w-full border p-2 rounded bg-background text-foreground" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full border p-2 rounded bg-background text-foreground" />
                </div>

                {/* Admin Status */}

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Rejected Remark</label>
                    <input name="rejectedRemark" value={formData.rejectedRemark} onChange={handleChange} className="w-full border p-2 rounded bg-background text-foreground" placeholder="Reason for rejection (if any)" />
                </div>

                <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                    {isModal && <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-muted">Cancel</button>}
                    <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">Save Doctor</button>
                </div>
            </form>
        </div>
    );

    if (isModal) {
        return (
            <Modal isOpen={true} onClose={onClose} maxWidth="max-w-4xl">
                {formContent}
            </Modal>
        );
    }
    return formContent;
};

export default DoctorForm;

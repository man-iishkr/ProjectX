import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MapPin, CheckCircle, XCircle, Loader2, Navigation } from 'lucide-react';
import { getDoctors } from '../../api/doctor.api';
import { createCallReport } from '../../api/call.api';
import { getProducts } from '../../api/inventory.api';
// import { useAuth } from '../../context/AuthContext'; // Not used in this version?

// Haversine formula to calculate distance in meters
const getDistanceFromLatLonInM = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d * 1000; // Distance in meters
};

const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
};

const ReportCall: React.FC = () => {
    // const { user } = useAuth();
    const [doctors, setDoctors] = useState<any[]>([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

    // Products State
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

    // Location State
    const [verifying, setVerifying] = useState(false);
    const [verified, setVerified] = useState(false);
    const [distance, setDistance] = useState<number | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

    // Form State
    const [remarks, setRemarks] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadDoctors();
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const res = await getProducts();
            if (res.success) {
                setProducts(res.data);
            }
        } catch (err) { console.error(err); }
    };

    const handleProductToggle = (productId: string) => {
        setSelectedProductIds(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const loadDoctors = async () => {
        try {
            const res = await getDoctors();
            if (res.success) {
                setDoctors(res.data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDoctorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedDoctorId(id);
        const doc = doctors.find(d => d._id === id);
        setSelectedDoctor(doc);

        // Reset verification
        setVerified(false);
        setDistance(null);
        setErrorMsg('');
        setUserLocation(null);
    };

    const handleVerifyLocation = () => {
        if (!selectedDoctor) return;

        // Check if doctor has coordinates
        if (!selectedDoctor.location || !selectedDoctor.location.coordinates || selectedDoctor.location.coordinates[0] === 0) {
            setErrorMsg("This doctor does not have a verified location set. Please ask Admin/HQ to update doctor details.");
            return;
        }

        setVerifying(true);
        setErrorMsg('');

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLat = position.coords.latitude;
                    const userLng = position.coords.longitude;
                    setUserLocation({ lat: userLat, lng: userLng });

                    const docLng = selectedDoctor.location.coordinates[0];
                    const docLat = selectedDoctor.location.coordinates[1];

                    const dist = getDistanceFromLatLonInM(userLat, userLng, docLat, docLng);
                    setDistance(Math.round(dist));

                    setVerifying(false);

                    // User requested 20m. Adding slight buffer to 30m for GPS accuracy.
                    const THRESHOLD = 30;

                    if (dist <= THRESHOLD) {
                        setVerified(true);
                    } else {
                        setErrorMsg(`You are ${Math.round(dist)}m away. Please move closer to the clinic (Target: 20m).`);
                        setVerified(false);
                    }
                },
                (error) => {
                    console.error(error);
                    setVerifying(false);
                    setErrorMsg("Failed to get your location. Please enable GPS.");
                },
                { enableHighAccuracy: true }
            );
        } else {
            setVerifying(false);
            setErrorMsg("Geolocation is not supported by this browser.");
        }
    };

    const handleSubmit = async () => {
        if (!verified || !userLocation) return;

        try {
            setSubmitting(true);

            // Append timestamp to remarks
            const timestampedRemarks = `[${new Date().toLocaleTimeString()}] ${remarks}`;

            const res = await createCallReport({
                doctorId: selectedDoctorId,
                latitude: userLocation.lat,
                longitude: userLocation.lng,
                remarks: timestampedRemarks,
                products: selectedProductIds // Send selected products
            });

            if (res.success) {
                alert(res.data.message || "Call Report Submitted Successfully!");
                // Reset form
                setSelectedDoctorId('');
                setSelectedDoctor(null);
                setVerified(false);
                setDistance(null);
                setRemarks('');
                setSelectedProductIds([]); // Reset products
                setUserLocation(null);
                loadDoctors();
            } else {
                alert(res.error || "Failed to submit report");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card className="max-w-xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location Verified Call Reporting
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">

                {/* 1. Select Doctor */}
                <div>
                    <label className="block text-sm font-medium mb-1">Select Doctor</label>
                    <select
                        value={selectedDoctorId}
                        onChange={handleDoctorChange}
                        className="w-full border p-2 rounded"
                    >
                        <option value="">-- Choose Doctor --</option>
                        {doctors.map(d => (
                            <option key={d._id} value={d._id}>{d.name} ({d.area})</option>
                        ))}
                    </select>
                </div>

                {/* 2. Verify Location */}
                {selectedDoctor && (
                    <div className="bg-slate-50 p-4 rounded-lg border">
                        <h4 className="font-semibold text-sm mb-2">Location Verification</h4>
                        <p className="text-xs text-muted-foreground mb-4">
                            You must be within 20 meters of the doctor's clinic to submit a report.
                        </p>

                        {!verified ? (
                            <div className="flex flex-col gap-2">
                                <Button
                                    onClick={handleVerifyLocation}
                                    disabled={verifying}
                                    className="w-full"
                                >
                                    {verifying ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Acquiring GPS...
                                        </>
                                    ) : (
                                        <>
                                            <Navigation className="h-4 w-4 mr-2" />
                                            Verify My Location
                                        </>
                                    )}
                                </Button>
                                {errorMsg && (
                                    <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
                                        <XCircle className="h-4 w-4" />
                                        {errorMsg}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-2 text-green-600">
                                <CheckCircle className="h-8 w-8 mb-1" />
                                <span className="font-bold">Location Verified!</span>
                                <span className="text-xs">Distance: {distance}m</span>
                            </div>
                        )}
                    </div>
                )}

                {/* 3. Products & Submit */}
                {verified && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">

                        {/* Products Multi-Select */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Discussed Products</label>
                            <div className="border rounded p-3 h-40 overflow-y-auto grid grid-cols-2 gap-2 bg-slate-50">
                                {products.map(product => (
                                    <label key={product._id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-100 p-1 rounded">
                                        <input
                                            type="checkbox"
                                            checked={selectedProductIds.includes(product._id)}
                                            onChange={() => handleProductToggle(product._id)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        {product.name}
                                    </label>
                                ))}
                                {products.length === 0 && <span className="text-xs text-muted-foreground col-span-2">No products found.</span>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Call Notes</label>
                            <textarea
                                className="w-full border p-2 rounded"
                                placeholder="Enter call details..."
                                rows={3}
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                            />
                        </div>

                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full bg-green-600 hover:bg-green-700"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                "Submit Call Report"
                            )}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ReportCall;

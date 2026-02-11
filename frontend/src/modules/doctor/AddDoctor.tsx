import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorForm from './DoctorForm';
import DoctorList from './DoctorList';

const AddDoctor: React.FC = () => {
    const navigate = useNavigate();
    const [refreshList, setRefreshList] = useState(0);

    const handleSuccess = () => {
        // Just refresh the list below instead of navigating
        setRefreshList(prev => prev + 1);
        // Optionally show success toast
        // navigate('/employee/doctors'); 
        // User wanted list "under add doctor", so we stay here?
        // Or maybe they expect to see it added then go to list?
        // Let's scroll to list or just update it.
    };

    const handleClose = () => {
        navigate(-1); // Go back
    };

    return (
        <div className="space-y-8">
            <div className="p-4 bg-card rounded-lg shadow-sm">
                <DoctorForm
                    onClose={handleClose}
                    onSuccess={handleSuccess}
                    isModal={false}
                />
            </div>

            <div className="p-4 bg-card rounded-lg shadow-sm">
                <DoctorList
                    key={refreshList}
                    hideAddButton={true}
                    title="My Doctors List"
                />
            </div>
        </div>
    );
};

export default AddDoctor;

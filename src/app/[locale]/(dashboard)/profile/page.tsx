'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useTranslations } from 'next-intl';
import { db, storage } from '@/lib/firebase';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ImagePlus, User as UserIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MultiSelect } from "@/components/ui/multi-select";

export default function ProfilePage() {
    const { user, profile } = useAuth();
    const [fullName, setFullName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [nearestStore, setNearestStore] = useState('');
    const [occupation, setOccupation] = useState<string[]>([]);
    const [avatarUrl, setAvatarUrl] = useState('');

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [stores, setStores] = useState<{ id: string, name: string }[]>([]);
    const t = useTranslations('Profile');
    const tOcc = useTranslations('Occupations');

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const q = query(
                    collection(db, 'stores'),
                    where('active', '==', true)
                );
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name
                }));
                if (data) setStores(data);
            } catch (err) {
                console.error("Error fetching stores:", err);
            }
        };
        fetchStores();
    }, []);

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
            setMobile(profile.mobile || '');
            setEmail(profile.email || '');
            setAddress(profile.address || '');
            setNearestStore(profile.nearest_store || '');
            setOccupation(profile.occupation || []);
            setAvatarUrl(profile.avatar_url || '');
        }
    }, [profile]);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!e.target.files || e.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            if (!user) throw new Error('User not authenticated.');

            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const filePath = `avatars/${user.id}/${Date.now()}.${fileExt}`;
            const storageRef = ref(storage, filePath);

            await uploadBytes(storageRef, file);
            const publicUrl = await getDownloadURL(storageRef);

            const profileRef = doc(db, 'profiles', user.id);
            await updateDoc(profileRef, { avatar_url: publicUrl });

            setAvatarUrl(publicUrl);
            setMessage({ type: 'success', text: 'Avatar updated successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setUploading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (!user) return;

        try {
            const profileRef = doc(db, 'profiles', user.id);
            await updateDoc(profileRef, {
                full_name: fullName,
                email: email,
                address: address,
                nearest_store: nearestStore,
                occupation: occupation,
            });

            setMessage({ type: 'success', text: t('updateSuccess') });
            setIsEditing(false); // Switch back to view mode
            window.location.reload();
        } catch (error: any) {
            setMessage({ type: 'error', text: t('updateError') + ': ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    if (!profile) return null;

    return (
        <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto p-4 md:p-6">
            <div className="flex flex-col items-center gap-4 mb-2">
                <div className="relative group">
                    <Avatar className="h-24 w-24 border-2 border-primary/20">
                        <AvatarImage src={avatarUrl} alt={fullName} />
                        <AvatarFallback className="bg-primary/5">
                            <UserIcon className="h-12 w-12 text-primary/40" />
                        </AvatarFallback>
                    </Avatar>
                    <label
                        htmlFor="avatar-upload"
                        className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform"
                    >
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                        <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            disabled={uploading}
                            className="hidden"
                        />
                    </label>
                </div>
                <div className="text-center">
                    <h2 className="text-xl font-bold">{fullName}</h2>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>{t('personalInfo')}</CardTitle>
                        <CardDescription>{t('personalDesc')}</CardDescription>
                    </div>
                    {!isEditing && (
                        <Button variant="outline" onClick={() => setIsEditing(true)}>{t('edit')}</Button>
                    )}
                </CardHeader>
                <form onSubmit={handleUpdate}>
                    <CardContent className="space-y-6">
                        {message && (
                            <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {message.text}
                            </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">{t('status')}</Label>
                                <div>
                                    <Badge className={profile.is_active ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}>
                                        {profile.is_active ? t('active') : t('inactive')}
                                    </Badge>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-muted-foreground">{t('pointsBalance')}</Label>
                                <div className="text-2xl font-bold text-primary">{profile.points_balance} pts</div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            {/* Identity Fields */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="aadhar" className="text-muted-foreground">{t('aadharNumber')}</Label>
                                    <div className="font-medium">{profile.aadhar || t('notSet')}</div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="gender" className="text-muted-foreground">{t('gender')}</Label>
                                    <div className="font-medium capitalize">{profile.gender ? t(profile.gender) : t('notSet')}</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="font-semibold text-lg">{t('contactOther')}</h3>

                            <div className="grid gap-2">
                                <Label htmlFor="fullName">{t('fullName')}</Label>
                                <Input
                                    id="fullName"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    disabled={true}
                                    className="bg-transparent border-0 px-0 h-auto font-medium text-lg shadow-none focus-visible:ring-0 opacity-100"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="mobile">{t('mobileNumber')}</Label>
                                <Input
                                    id="mobile"
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                    disabled={true}
                                    className="bg-transparent border-0 px-0 h-auto font-medium text-lg shadow-none focus-visible:ring-0 opacity-100"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">{t('email')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={!isEditing}
                                    placeholder={isEditing ? "Enter your email" : t('notSet')}
                                    className={!isEditing ? "bg-transparent border-0 px-0 h-auto font-medium text-lg shadow-none focus-visible:ring-0" : ""}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="address">{t('address')}</Label>
                                <Input
                                    id="address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    disabled={!isEditing}
                                    placeholder={isEditing ? t('addressPlaceholder') : t('notSet')}
                                    className={!isEditing ? "bg-transparent border-0 px-0 h-auto font-medium text-lg shadow-none focus-visible:ring-0" : ""}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="nearestStore">{t('nearestStore')}</Label>
                                {isEditing ? (
                                    <Select
                                        value={nearestStore}
                                        onValueChange={setNearestStore}
                                    >
                                        <SelectTrigger id="nearestStore" className="w-full">
                                            <SelectValue placeholder={t('nearestStore')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {stores.map((store) => (
                                                <SelectItem key={store.id} value={store.name}>
                                                    {store.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="font-medium text-lg leading-7">
                                        {nearestStore || t("notSet")}
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="occupation">{t('occupation')}</Label>
                                {isEditing ? (
                                    <MultiSelect
                                        options={[
                                            { value: "missionary", label: tOcc('missionary') },
                                            { value: "engineer", label: tOcc('engineer') },
                                            { value: "electrician", label: tOcc('electrician') },
                                            { value: "plumber", label: tOcc('plumber') },
                                            { value: "painter", label: tOcc('painter') },
                                            { value: "carpenter", label: tOcc('carpenter') },
                                            { value: "tiles", label: tOcc('tiles') },
                                            { value: "welder", label: tOcc('welder') },
                                        ]}
                                        selected={occupation}
                                        onChange={setOccupation}
                                        placeholder="Select occupation"
                                    />
                                ) : (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {occupation.length > 0 ? (
                                            occupation.map((occ) => (
                                                <Badge key={occ} variant="secondary">
                                                    {['missionary', 'engineer', 'electrician', 'plumber', 'painter', 'carpenter', 'tiles', 'welder'].includes(occ)
                                                        ? tOcc(occ)
                                                        : occ}
                                                </Badge>
                                            ))
                                        ) : (
                                            <div className="font-medium text-lg leading-7">{t("notSet")}</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>

                    {isEditing && (
                        <CardFooter className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={() => {
                                setIsEditing(false);
                                setFullName(profile.full_name || '');
                                setMobile(profile.mobile || '');
                                setAddress(profile.address || '');
                                setNearestStore(profile.nearest_store || '');
                                setOccupation(profile.occupation || []);
                            }}>
                                {t('cancel')}
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t('saveChanges')}
                            </Button>
                        </CardFooter>
                    )}
                </form>
            </Card>
        </div>
    );
}

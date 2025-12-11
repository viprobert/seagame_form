import React, { useState, useEffect, useMemo } from 'react';
import './Form.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Subdistrict {
  id: number;
  provinceCode: number;
  districtCode: number;
  subdistrictCode: number;
  subdistrictNameEn: string;
  subdistrictNameTh: string;
  postalCode: string;
}

interface District {
  id: number;
  provinceCode: number;
  districtCode: number;
  districtNameEn: string;
  districtNameTh: string;
  postalCode: string;
}

interface Province {
  id: number;
  provinceCode: number;
  provinceNameEn: string;
  provinceNameTh: string;
}

interface FormData {
  website: string;
  username: string;
  receiverName: string;
  houseNo: string;
  road: string;
  soi: string;
  village: string;
  subdistrict: string;
  district: number;
  province: number;
  postcode: string;
  phone: string;
}

interface Site {
  name: string;
  logo: string;
}

const Form = () => {
    const [formData, setFormData] = useState<FormData>({
        website: '',
        username: '',
        receiverName: '',
        houseNo: '',
        road: '',
        soi: '',
        village: '',
        subdistrict: '',
        district: 0,
        province: 0,
        postcode: '',
        phone: '',
    });

    const [provinces, setProvinces] = useState<Province[]>([]);
    const [allDistricts, setAllDistricts] = useState<District[]>([]);
    const [allSubdistricts, setAllSubdistricts] = useState<Subdistrict[]>([]);
    const [site, setSite] = useState<Site | null>(null);
    const [isInvalidSite, setIsInvalidSite] = useState<boolean>(false);

    useEffect(() => {
        const path = window.location.pathname.split('/');
        const siteName = path[path.length - 1];

        fetch('/thaigeo/provinces.json')
            .then((response) => response.json())
            .then((data) => setProvinces(data));

        fetch('/thaigeo/district.json')
            .then((response) => response.json())
            .then((data) => setAllDistricts(data));

        fetch('/thaigeo/subdistricts.json')
              .then((response) => response.json())
              .then((data) => {
                const mappedData = data.map((sub: any) => ({
                  id: sub.id,
                  provinceCode: Number(sub.provinceCode),
                  districtCode: Number(sub.districtCode),
                  subdistrictCode: Number(sub.subdistrictCode),
                  subdistrictNameEn: sub.subdistrictNameEn,
                  subdistrictNameTh: sub.subdistrictNameTh,
                  postalCode: sub.postalCode,
                }));
                setAllSubdistricts(mappedData);
              });
        fetch('/site.json')
            .then((response) => response.json())
            .then((data) => {
            const foundSite = data.find((site: Site) => site.name.toLowerCase() === siteName.toLowerCase());
            if (foundSite) {
                setSite(foundSite);
                setIsInvalidSite(false);
            } else {
                setSite(null);
                setIsInvalidSite(true);
                toast.error('เว็บไซต์ไม่ถูกต้อง กรุณาตรวจสอบ URL', {
                    position: 'top-center',
                    autoClose: 5000,
                });
            }
        });
    }, []);

    const filteredDistricts = useMemo(() => {
        if (!formData.province) return [];
        return allDistricts.filter(
        (district) => district.provinceCode === formData.province
        );
    }, [formData.province, allDistricts]);

    const filteredSubdistricts = useMemo(() => {
        const { province, district } = formData;
        if (!province || !district) {
          return [];
        }
  
        return allSubdistricts.filter((subdistrict) => {
        const isMatch = (
            subdistrict.districtCode === district
        );
        
        return isMatch;
        });
    }, [formData.province, formData.district, allSubdistricts]);

    useEffect(() => {
        if (formData.subdistrict) {
        const selectedSubdistrict = allSubdistricts.find(
            (sub) => sub.subdistrictCode === Number(formData.subdistrict) && 
                    sub.provinceCode === formData.province &&
                    sub.districtCode === formData.district
        );
        if (selectedSubdistrict) {
            setFormData(prevData => ({ ...prevData, postcode: selectedSubdistrict.postalCode }));
        }
        }
    }, [formData.subdistrict, formData.province, formData.district, allSubdistricts]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newValue = name === 'province' || name === 'district' ? Number(value) : value;

    setFormData((prevFormData) => {
      let updatedData = { ...prevFormData, [name]: newValue };

      if (name === 'province') {
        updatedData.district = 0;
        updatedData.subdistrict = '';
        updatedData.postcode = '';
      }

      if (name === 'district') {
        updatedData.subdistrict = '';
        updatedData.postcode = '';

        const nextProvinceCode = updatedData.province;
        const nextDistrictCode = Number(newValue);
      }
      
      if (name === 'province' && value === '') {
          updatedData.province = 0;
          updatedData.district = 0;
          updatedData.subdistrict = '';
          updatedData.postcode = '';
      }
      if (name === 'district' && value === '') {
          updatedData.district = 0;
          updatedData.subdistrict = '';
          updatedData.postcode = '';
      }
      
      return updatedData;
    });
  };

  const clearForm = () => {
    setFormData({
      website: '',
      receiverName: '',
      username: '',
      phone: '',
      province: 0,
      district: 0,
      subdistrict: '',
      village: '',
      soi: '',
      road: '',
      houseNo: '',
      postcode: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // if (isInvalidSite || !site) {
    //     toast.error('เว็บไซต์ไม่ถูกต้อง กรุณาตรวจสอบ URL', {
    //         position: 'top-center',
    //         autoClose: 5000,
    //     });
    //     return;
    // }

    const requiredFields = ['username', 'receiverName', 'houseNo', 'district', 'province', 'subdistrict', 'phone'];
    for (let field of requiredFields) {
      if (!formData[field as keyof FormData]) {
        alert(`กรุณากรอกข้อมูลในช่อง ${field}`);
        return;
      }
    }

    const provinceName = provinces.find((province) => province.provinceCode === formData.province)?.provinceNameTh || '';
    const districtName = allDistricts.find((district) => district.districtCode === formData.district)?.districtNameTh || '';
    const subdistrictName = allSubdistricts.find((subdistrict) => Number(formData.subdistrict))?.subdistrictNameTh || '';

    const payload = {
      site: site?.name,
      name: formData.receiverName,
      username: formData.username,
      phone: formData.phone,
      provinces: provinceName,
      district: districtName,
      subDistrict: subdistrictName,
      village: formData.village,
      alley: formData.soi,
      road: formData.road,
      house: formData.houseNo,
      postalCode: formData.postcode,
      status: 'pending',
    };

    try {
      const response = await fetch('https://b-api.thaideal.co/api/prize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.status === 200) {
        toast.success('บันทึกสำเร็จ', {
            position: 'top-center',
            autoClose: 5000,
            onClose: () => clearForm(),
        });
      } else {
        toast.error(result.error || 'An error occurred', {
            position: 'top-center',
            autoClose: 5000,
        });
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.', {
        position: 'top-center',
        autoClose: 5000,
      });
    }
  };

  return (
    <div className="page-wrapper">
      <div className="form-card">
        <div className="form-header">
          <img
            src="/OKVIP-SEAGAME-2025.png"
            alt="OKVIP SEA Games 2025"
            className="form-logo"
          />
          <h1>กรอกที่อยู่เพื่อรับของรางวัล</h1>
          <p>กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง เพื่อให้จัดส่งของรางวัลไปถึงคุณได้อย่างรวดเร็ว</p>
        </div>

        <form onSubmit={handleSubmit}>
            <div className="section-title">1. ข้อมูลเว็บไซต์</div>
            <div className="form-group">
                {isInvalidSite ? (
                    <h1>Invalid site</h1>
                ) : site ? (
                    <div className="site-header">
                        <img src={`/logos/${site.logo}`} alt={site.name} className="site-logo" draggable="false"/>
                    </div>
                ) : (
                     <p>Loading site...</p>
                )}
            </div>
            {/* Account Information */}
            <div className="section-title">2. ข้อมูลบัญชี</div>
            <div className="form-grid">
            <div className="form-group">
              <label htmlFor="username">ยูสเซอร์ (User) <span className="required">*</span></label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="กรอกยูสเซอร์เนมของคุณ"
                required
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="receiverName">ชื่อ–นามสกุลผู้รับ <span className="required">*</span></label>
              <input
                id="receiverName"
                name="receiverName"
                type="text"
                placeholder="เช่น นายสมชาย ใจดี"
                required
                value={formData.receiverName}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="section-title">3. ข้อมูลที่อยู่</div>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="province">3.1 จังหวัด <span className="required">*</span></label>
              <select
                id="province"
                name="province"
                value={formData.province}
                onChange={handleChange}
                required
              >
                <option value="">เลือกจังหวัด</option>
                {provinces.map((province) => (
                  <option key={province.provinceCode} value={province.provinceCode}>
                    {province.provinceNameTh} ({province.provinceNameEn})
                  </option>
                ))}
              </select>
            </div>

            {/* District Dropdown */}
            <div className="form-group">
              <label htmlFor="district">3.2 อำเภอ / เขต <span className="required">*</span></label>
              <select
                id="district"
                name="district"
                value={formData.district}
                onChange={handleChange}
                required
                disabled={!formData.province}
              >
                <option value="">เลือกเขต / อำเภอ</option>
                {filteredDistricts.map((district) => (
                  <option key={district.districtCode} value={district.districtCode}>
                    {district.districtNameTh} ({district.districtNameEn})
                  </option>
                ))}
              </select>
            </div>

            {/* Subdistrict Dropdown */}
            <div className="form-group">
              <label htmlFor="subdistrict">3.3 ตำบล / แขวง <span className="required">*</span></label>
              <select
                id="subdistrict"
                name="subdistrict"
                value={formData.subdistrict}
                onChange={handleChange}
                required
                disabled={!formData.district}
              >
                <option value="">เลือกตำบล / แขวง</option>
                {filteredSubdistricts.map((subdistrict) => (
                    <option 
                        key={subdistrict.subdistrictCode} 
                        value={String(subdistrict.subdistrictCode)}
                    >
                        {subdistrict.subdistrictNameTh} ({subdistrict.subdistrictNameEn})
                    </option>
                ))}
              </select>
            </div>

            {/* Other Address Fields */}
             <div className="form-group">
              <label htmlFor="village">3.7 หมู่บ้าน / อาคาร</label>
              <input
                id="village"
                name="village"
                type="text"
                placeholder="เช่น หมู่บ้านตัวอย่าง, อาคาร B"
                value={formData.village}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="soi">3.6 ซอย</label>
              <input
                id="soi"
                name="soi"
                type="text"
                placeholder="เช่น ซอย 5, ซอยสุขุมวิท 50"
                value={formData.soi}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="road">3.5 ชื่อถนน</label>
              <input
                id="road"
                name="road"
                type="text"
                placeholder="เช่น ถนนพระราม 2"
                value={formData.road}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="houseNo">3.4 บ้านเลขที่ <span className="required">*</span></label>
              <input
                id="houseNo"
                name="houseNo"
                type="text"
                placeholder="เช่น 123/45"
                required
                value={formData.houseNo}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="postcode">3.8 รหัสไปรษณีย์ <span className="required">*</span></label>
              <input
                id="postcode"
                name="postcode"
                type="text"
                pattern="[0-9]{5}"
                maxLength={5}
                placeholder="เช่น 10110"
                required
                value={formData.postcode}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Phone Section */}
          <div className="section-title">4. เบอร์โทรติดต่อ</div>
          <div className="form-group">
            <label htmlFor="phone">เบอร์โทรศัพท์ผู้รับ <span className="required">*</span></label>
            <input
              id="phone"
              name="phone"
              type="tel"
              pattern="[0-9]{9,10}"
              maxLength={10}
              placeholder="เช่น 0812345678"
              required
              value={formData.phone}
              onChange={handleChange}
            />
            <div className="hint">ใช้สำหรับติดต่อแจ้งสถานะการจัดส่ง หรือเมื่อที่อยู่ไม่ชัดเจน</div>
          </div>

          <div className="btn-row">
            <button type="reset" className="btn btn-secondary">ล้างข้อมูล</button>
            <button type="submit" className="btn btn-primary">ยืนยันส่งที่อยู่</button>
          </div>
        </form>

         <ToastContainer />
      </div>
    </div>
  );
};

export default Form;

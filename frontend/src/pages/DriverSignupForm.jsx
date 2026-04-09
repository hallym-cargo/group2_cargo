import React, { useState } from "react";
import axios from "axios";
import "./LoginPage.css";

const DriverSignupPage = ({ controller }) => {
    const [vehicleType, setVehicleType] = useState("");
    const [search, setSearch] = useState("");
    const [vehicleDropdownVisible, setVehicleDropdownVisible] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");

    const [form, setForm] = useState({
        email: "",
        password: "",
        name: "",
        phone: ""
    });

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const vehicleOptions = [
        "1톤 트럭", "다마스", "라보",
        "1.4톤 트럭", "2.5톤 트럭", "3.5톤 트럭",
        "5톤 트럭", "5톤 플러스 트럭", "8톤 트럭",
        "11톤 트럭", "11톤 플러스 트럭",
        "3.5톤 광폭", "14톤 트럭", "18톤 트럭", "25톤 트럭"
    ];

    const filteredVehicles = vehicleOptions.filter(v =>
        v.toLowerCase().includes(search.toLowerCase())
    );

    const handleSignup = async () => {
        if (!form.email) {
            alert("이메일을 입력해주세요");
            return;
        }

        if (!form.email.includes("@")) {
            alert("올바른 이메일 형식이 아닙니다");
            return;
        }

        if (!form.password) {
            alert("비밀번호를 입력해주세요");
            return;
        }

        if (!confirmPassword) {
            alert("비밀번호 확인을 입력해주세요");
            return;
        }

        if (form.password !== confirmPassword) {
            alert("비밀번호가 일치하지 않습니다");
            return;
        }

        if (!form.name) {
            alert("이름을 입력해주세요");
            return;
        }

        if (!vehicleType) {
            alert("차량 종류를 선택해주세요");
            return;
        }

        try {
            const res = await axios.post("http://localhost:8080/auth/signup", {
                ...form,
                vehicleType: vehicleType,
                role: "DRIVER"
            });

            alert("회원가입 성공!");
            controller.setRoutePage("login");

        } catch (err) {
            alert("회원가입 실패: " + (err.response?.data?.message || "오류 발생"));
        }
    };

    return (
        <>
            {/* 이메일 필수 */}
            <label className="login-label">
                이메일 <span className="required">*</span>
            </label>
            <input
                className="login-input"
                name="email"
                value={form.email}
                onChange={handleChange}
            />

            {/* 비밀번호 필수 */}
            <label className="login-label">
                비밀번호 <span className="required">*</span>
            </label>
            <input
                type="password"
                className="login-input"
                name="password"
                value={form.password}
                onChange={handleChange}
            />

            <div className="label-row">
                <label className="login-label">
                    비밀번호 확인 <span className="required">*</span>
                </label>

                {confirmPassword && (
                    <span
                        className={`password-check ${form.password === confirmPassword ? "success" : "error"
                            }`}
                    >
                        {form.password === confirmPassword
                            ? "일치합니다"
                            : "일치하지 않습니다"}
                    </span>
                )}
            </div>

            <input
                type="password"
                className="login-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {/* 이름 필수 */}
            <label className="login-label">
                이름 <span className="required">*</span>
            </label>
            <input
                className="login-input"
                name="name"
                value={form.name}
                onChange={handleChange}
            />

            {/* 전화번호 선택 */}
            <label className="login-label">전화번호</label>
            <input
                className="login-input"
                name="phone"
                value={form.phone}
                onChange={handleChange}
            />

            {/* 차량 종류 선택 */}
            <label className="login-label">
                차량 종류 <span className="required">*</span>
            </label>

            <div className="input-wrapper">
                <input
                    type="text"
                    placeholder="차량 종류 검색"
                    value={vehicleType || search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setVehicleType("");   // 검색 시작하면 선택값 해제
                    }}
                    onClick={() => {
                        setVehicleDropdownVisible(true);
                        setVehicleType("");   // 선택값 초기화 (검색 가능하게)
                    }}
                    className="login-input"
                />

                {vehicleDropdownVisible && (
                    <div className="vehicle-list">
                        {filteredVehicles.map((v, i) => (
                            <div
                                key={i}
                                className={`vehicle-item ${vehicleType === v ? "active" : ""}`}
                                onClick={() => {
                                    setVehicleType(v);
                                    setVehicleDropdownVisible(false); // 선택 후 숨기기
                                    setSearch(""); // 검색어 초기화
                                }}
                            >
                                {v}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button className="login-button" onClick={handleSignup}>
                회원가입
            </button>
        </>
    );
};

export default DriverSignupPage;
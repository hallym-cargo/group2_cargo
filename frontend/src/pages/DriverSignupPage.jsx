import React, { useState } from "react";
import axios from "axios";
import "./LoginPage.css";

const DriverSignupPage = ({ controller }) => {

    const [form, setForm] = useState({
        email: "",
        password: "",
        name: "",
        phone: "",
        vehicleType: ""
    });

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSignup = async () => {
        try {
            const res = await axios.post("http://localhost:8080/auth/signup", {
                ...form,
                role: "DRIVER"
            });

            console.log("회원가입 성공:", res.data);

            alert("회원가입 성공!");
            controller.setRoutePage("login");

        } catch (err) {
            console.error(err);
            alert("회원가입 실패: " + (err.response?.data?.message || "오류 발생"));
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">

                <h2 className="login-title">차주 회원가입</h2>

                {/* 이메일 필수 */}
                <label className="login-label">이메일</label>
                <input
                    className="login-input"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                />

                {/* 비밀번호 필수 */}
                <label className="login-label">비밀번호</label>
                <input
                    type="password"
                    className="login-input"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                />

                {/* 이름 필수 */}
                <label className="login-label">이름</label>
                <input
                    className="login-input"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                />

                {/* 전화번호 선택 */}
                <label className="login-label">전화번호 (선택)</label>
                <input
                    className="login-input"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                />

                {/* 차량 종류 사실상 필수임 */}
                <label className="login-label">차량 종류</label>
                <input
                    className="login-input"
                    name="vehicleType"
                    placeholder="예: 1톤 트럭"
                    value={form.vehicleType}
                    onChange={handleChange}
                />

                <button className="login-button" onClick={handleSignup}>
                    회원가입
                </button>

                {/* 뒤로가기 */}
                <div
                    className="back-to-main"
                    onClick={() => controller.setRoutePage("signup")}
                >
                    회원가입으로 돌아가기
                </div>

            </div>
        </div>
    );
};

export default DriverSignupPage;
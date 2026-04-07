import React, { useState } from "react";
import "./LoginPage.css";

const SignupPage = ({ controller }) => {
    const handleSelectRole = (role) => {
        controller.setSignupForm({
            ...controller.signupForm,
            role,
        });

        console.log("선택된 역할:", role);
    };

    return (
        <div className="login-container">
            <div className="login-box">

                {/* 제목 */}
                <h2 className="login-title">회원가입</h2>

                <div className="signup-card-container">

                    <div
                        className="signup-card"
                        onClick={() => controller.setRoutePage("signup-shipper")}
                    >
                        <div className="signup-card-title">화주</div>
                        <div className="signup-card-desc">
                            화물 운송을 <br />
                            의뢰하는 기업 또는 개인
                        </div>
                    </div>

                    <div
                        className="signup-card"
                        onClick={() => controller.setRoutePage("signup-driver")}
                    >
                        <div className="signup-card-title">차주</div>
                        <div className="signup-card-desc">
                            전문적인 화물 운송 서비스를 제공하는 운송 사업자
                        </div>
                    </div>

                </div>

                {/* 뒤로가기 */}
                <div
                    className="back-to-main signup-back"
                    onClick={() => controller.setRoutePage("login")}
                >
                    로그인으로 돌아가기
                </div>

            </div>
        </div>
    );
};

export default SignupPage;
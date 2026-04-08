import React, { useState } from "react";
import axios from "axios";
import "./LoginPage.css";

const ForgotPasswordPage = ({ controller }) => {
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleReset = async () => {
        if (!email) {
            alert("이메일을 입력해주세요");
            return;
        }

        if (!newPassword) {
            alert("새 비밀번호를 입력해주세요");
            return;
        }

        if (!confirmPassword) {
            alert("비밀번호 확인을 입력해주세요");
            return;
        }

        if (newPassword !== confirmPassword) {
            alert("비밀번호가 일치하지 않습니다");
            return;
        }

        try {
            await axios.post("http://localhost:8080/auth/reset-password", {
                email,
                newPassword
            });

            alert("비밀번호가 변경되었습니다!");
            controller.setRoutePage("login");

        } catch (err) {
            alert("오류: " + (err.response?.data || "실패"));
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">

                <h2 className="login-title">비밀번호 재설정</h2>

                <label className="login-label">이메일</label>
                <input
                    className="login-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <label className="login-label">새 비밀번호</label>
                <input
                    type="password"
                    className="login-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                />

                <label className="login-label">비밀번호 확인</label>
                <input
                    type="password"
                    className="login-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />

                {confirmPassword && (
                    <div
                        style={{
                            color: newPassword === confirmPassword ? "green" : "red",
                            fontSize: "12px",
                            marginTop: "5px"
                        }}
                    >
                        {newPassword === confirmPassword
                            ? "비밀번호가 일치합니다"
                            : "비밀번호가 일치하지 않습니다"}
                    </div>
                )}

                <button className="login-button" onClick={handleReset}>
                    비밀번호 변경
                </button>

                <div
                    className="back-to-main"
                    onClick={() => controller.setRoutePage("login")}
                >
                    로그인으로 돌아가기
                </div>

            </div>
        </div>
    );
};

export default ForgotPasswordPage;
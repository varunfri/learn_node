import agora from "agora-access-token";
const { RtcTokenBuilder, RtcRole } = agora;


export const agora_token = async (req, res) => {
    const app_id = process.env.AGORA_APP_ID;
    const app_cert = process.env.AGORA_APP_CERTIFICATE;
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            status: 400,
            message: "Request body is required"
        });
    }

    const { uid, channel_name, role } = req.body || {};


    if (!uid || !channel_name || !role) {
        return res.status(400).json({
            status: 400,
            message: "channel name, uid and role is required"
        });
    }

    try {
        const user_role =
            role.toLowerCase() === "publisher"
                ? RtcRole.PUBLISHER
                : RtcRole.SUBSCRIBER;



        const expirationTimeInSeconds = 3600;
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpireTime =
            currentTimestamp + expirationTimeInSeconds;



        const token = RtcTokenBuilder.buildTokenWithUid(
            app_id,
            app_cert,
            channel_name,
            uid,
            user_role,
            privilegeExpireTime
        );

        res.status(200).
            header('X-Stream-Token', token).
            json({
                status: 200,
                message: "Token generated successfully",
            });

    } catch (error) {
        res.status(500).json(
            {
                status: 500,
                message: "Unable to generate stream token"
            }
        );
    }
};

// refresh token automatically when agora sdk emits : onTokenPrivilegeWillExpire
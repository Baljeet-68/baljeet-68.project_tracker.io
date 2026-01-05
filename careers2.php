<?php
/**
 * MODERN CAREERS PAGE - FULL FEATURED
 */

// 1. URLs
$BASE_API_URL = "https://mmfinfotech.website/Project_Tracker_Tool/server/api";
$INTERNAL_API_URL = "http://127.0.0.1:4000/Project_Tracker_Tool/server/api";

function apiRequest($endpoint, $method = 'GET', $data = null) {
    global $BASE_API_URL, $INTERNAL_API_URL;
    
    $urls = [$BASE_API_URL . $endpoint, $INTERNAL_API_URL . $endpoint];
    $lastResult = null;

    foreach ($urls as $url) {
        $options = [
            'http' => [
                'method'  => $method,
                'header'  => "Content-Type: application/json\r\n",
                'timeout' => 5,
                'ignore_errors' => true
            ]
        ];

        if ($data) {
            $options['http']['content'] = json_encode($data);
        }

        $context = stream_context_create($options);
        $response = @file_get_contents($url, false, $context);
        
        if ($response !== false) {
            $status_line = $http_response_header[0];
            preg_match('{HTTP\/\S*\s(\d{3})}', $status_line, $match);
            $status = $match[1];
            
            return [
                'data' => json_decode($response, true),
                'code' => (int)$status,
                'error' => ''
            ];
        }
    }

    return ['data' => null, 'code' => 0, 'error' => 'Connection failed'];
}

    // Handle Application Submission
    $message = '';
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['apply_job'])) {
        $fullName = trim($_POST['full_name']);
        $email = trim($_POST['email']);
        $phone = trim($_POST['phone']);
        $hasFile = isset($_FILES['resume_file']) && $_FILES['resume_file']['error'] === UPLOAD_ERR_OK;

        // PHP Validation
        if (empty($fullName) || empty($email) || empty($phone) || !$hasFile) {
            $message = '<div class="alert error">All fields marked with * are mandatory, including your resume file.</div>';
        } else {
            $payload = [
                'jobId'       => $_POST['job_id'],
                'fullName'    => $fullName,
                'email'       => $email,
                'phone'       => $phone,
                'coverLetter' => $_POST['cover_letter']
            ];

            // Handle File Upload (Convert to Base64/Binary representation for the API)
            if ($hasFile) {
                $fileData = file_get_contents($_FILES['resume_file']['tmp_name']);
                $payload['resumeFile'] = [
                    'name' => $_FILES['resume_file']['name'],
                    'type' => $_FILES['resume_file']['type'],
                    'data' => base64_encode($fileData)
                ];
            }

            $response = apiRequest('/public-apply', 'POST', $payload);
            
            if ($response['code'] === 201) {
                $message = '<div class="alert success">Application submitted successfully! Our HR team will contact you.</div>';
            } else {
                $message = '<div class="alert error">Failed to submit application: ' . ($response['data']['error'] ?? 'Unknown error') . '</div>';
            }
        }
    }

// Fetch Jobs
$jobResponse = apiRequest('/public-jobs');
$jobs = ($jobResponse['code'] === 200 && is_array($jobResponse['data'])) ? $jobResponse['data'] : [];

$selectedJobId = isset($_GET['job']) ? trim($_GET['job']) : '';
$selectedJob = null;
if (!empty($selectedJobId)) {
    foreach ($jobs as $j) {
        if (isset($j['id']) && (string)$j['id'] === (string)$selectedJobId) {
            $selectedJob = $j;
            break;
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Careers | MMF Infotech</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #3fa205;
            --primary-hover: #358a04;
            --bg: #ffffff;
            --text: #333333;
            --text-light: #666666;
            --card-bg: #ffffff;
            --border: #eeeeee;
            --success: #3fa205;
            --error: #ef4444;
            --dark-bg: #2d3139;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: inherit; background-color: var(--bg); color: var(--text); line-height: 1.6; }
        
        .container { max-width: 1200px; margin: 0 auto; padding: 60px 20px; }
        
        header { text-align: center; margin-bottom: 60px; }
        header h1 { font-size: 2.2rem; color: var(--text); margin-bottom: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
        header .underline { width: 60px; height: 3px; background: var(--primary); margin: 0 auto 20px; }
        header p { color: var(--text-light); font-size: 1.1rem; }

        .alert { padding: 15px; border-radius: 4px; margin-bottom: 25px; text-align: center; font-weight: 500; }
        .alert.success { background: #e9f7e6; color: #2e7d32; border: 1px solid #c8e6c9; }
        .alert.error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

        .job-grid { 
            display: flex; 
            flex-direction: column;
            gap: 12px; 
            padding: 20px 0;
        }

        .job-head {
            display: grid;
            grid-template-columns: 2fr 1.1fr 1fr 0.7fr;
            gap: 16px;
            padding: 12px 18px;
            border: 1px solid var(--border);
            border-radius: 8px;
            background: #f8fafc;
            color: var(--text-light);
            font-weight: 700;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.06em;
        }

        .job-row { 
            background: var(--card-bg); 
            border: 1px solid var(--border); 
            border-radius: 8px; 
            padding: 16px 18px; 
            display: grid;
            grid-template-columns: 2fr 1.1fr 1fr 0.7fr;
            gap: 16px;
            align-items: center;
            transition: all 0.3s ease;
        }

        .job-row:hover {
            border-color: var(--primary);
            box-shadow: 0 5px 15px rgba(63, 162, 5, 0.1);
            transform: translateX(5px);
        }

        .job-title-cell {
            display: flex;
            align-items: center;
            gap: 14px;
            min-width: 0;
        }

        .job-icon {
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f9f9f9;
            border-radius: 50%;
            transition: all 0.3s ease;
            flex-shrink: 0;
        }

        .job-icon svg {
            width: 24px;
            height: 24px;
            fill: var(--primary);
        }

        .job-row:hover .job-icon {
            background: var(--primary);
        }

        .job-row:hover .job-icon svg {
            fill: #ffffff;
        }

        .job-title { 
            font-size: 1.1rem; 
            font-weight: 600; 
            color: var(--text);
            margin: 0;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .apply-btn { 
            background: var(--primary); 
            color: white; 
            border: none; 
            padding: 10px 25px; 
            border-radius: 4px; 
            font-weight: 600; 
            font-size: 0.9rem;
            cursor: pointer; 
            transition: all 0.3s ease;
            margin-left: 20px;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }

        .apply-btn:hover {
            background: var(--primary-hover);
            transform: scale(1.05);
        }

        .job-cell {
            color: var(--text-light);
            font-size: 0.95rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .view-btn {
            background: transparent;
            color: var(--primary);
            border: 1px solid rgba(63, 162, 5, 0.35);
            padding: 10px 14px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.2s ease;
            width: fit-content;
            justify-self: end;
        }

        .view-btn:hover {
            background: rgba(63, 162, 5, 0.08);
            border-color: var(--primary);
        }

        .job-details-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 10px;
        }

        .back-link {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            color: var(--primary);
            font-weight: 800;
            text-decoration: none;
            margin: 6px 0 18px;
        }

        .back-link:hover {
            text-decoration: underline;
        }

        .panel {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 26px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.04);
        }

        .job-meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px 16px;
            margin: 14px 0 18px;
            padding: 14px 16px;
            border: 1px solid var(--border);
            border-radius: 8px;
            background: #f8fafc;
        }

        .job-meta-item {
            display: flex;
            flex-direction: column;
            gap: 3px;
        }

        .job-meta-label {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            font-weight: 800;
            color: var(--text-light);
        }

        .job-meta-value {
            font-size: 0.95rem;
            font-weight: 700;
            color: var(--text);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .job-description {
            color: var(--text);
            font-size: 0.98rem;
            line-height: 1.75;
        }

        .job-description ul,
        .job-description ol {
            padding-left: 18px;
            margin: 10px 0;
        }

        .job-description a {
            color: var(--primary);
            font-weight: 700;
            text-decoration: none;
        }

        .job-description a:hover {
            text-decoration: underline;
        }

        /* Modal / Form Styles */
        .modal { 
            display: none; 
            position: fixed; 
            top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0,0,0,0.7); 
            z-index: 1000; 
            align-items: center; 
            justify-content: center;
            padding: 20px;
            backdrop-filter: blur(5px);
        }
        .modal.active { display: flex; }
        
        .modal-content { 
            background: white; 
            padding: 40px; 
            border-radius: 8px; 
            width: 100%; 
            max-width: 550px; 
            position: relative; 
            max-height: 90vh; 
            overflow-y: auto;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        
        .close-modal { 
            position: absolute; 
            top: 15px; right: 20px; 
            font-size: 28px; 
            cursor: pointer; 
            color: #999;
            transition: color 0.2s;
        }
        .close-modal:hover { color: var(--text); }

        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; font-weight: 700; margin-bottom: 8px; font-size: 0.85rem; text-transform: uppercase; color: #555; }
        .form-group input, .form-group textarea { 
            width: 100%; 
            padding: 12px 15px; 
            border: 1px solid #ddd; 
            border-radius: 4px; 
            font-family: inherit;
            font-size: 0.95rem;
            transition: border-color 0.2s;
        }
        .form-group input:focus, .form-group textarea:focus { outline: none; border-color: var(--primary); }
        
        .submit-btn { 
            width: 100%; 
            background: var(--primary); 
            color: white; 
            border: none; 
            padding: 15px; 
            border-radius: 4px; 
            font-weight: 700; 
            font-size: 1rem;
            text-transform: uppercase;
            cursor: pointer;
            transition: background 0.3s;
        }
        .submit-btn:hover { background: var(--primary-hover); }
        
        .empty-state { text-align: center; padding: 60px; color: var(--text-light); grid-column: 1 / -1; }

        @media (max-width: 768px) {
            header h1 { font-size: 1.8rem; }
            .job-head { display: none; }
            .job-row {
                grid-template-columns: 1fr;
                gap: 10px;
                padding: 16px 16px;
                transform: none;
            }
            .job-row:hover { transform: none; }
            .view-btn { justify-self: start; }
            .job-meta-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>

<div class="container">
    <header>
        <h1>Current Openings</h1>
        <div class="underline"></div>
        <p>Join the MMF Infotech family and build your future with us</p>
    </header>

    <?php echo $message; ?>

    <?php if ($selectedJob): ?>
        <a class="back-link" href="careers2.php">← Back to Jobs</a>
        <?php
            $selectedLocation = $selectedJob['location'] ?? '';
            $selectedSalary = $selectedJob['salary'] ?? '';
            $selectedCreatedAtRaw = $selectedJob['createdAt'] ?? ($selectedJob['created_at'] ?? '');
            $selectedCreatedAt = '';
            if (!empty($selectedCreatedAtRaw)) {
                $ts = strtotime($selectedCreatedAtRaw);
                if ($ts !== false) $selectedCreatedAt = date('d M Y', $ts);
            }
            $selectedDescription = $selectedJob['description'] ?? '';
            if (!empty($selectedDescription)) {
                $selectedDescription = preg_replace('#<script\b[^>]*>.*?</script>#is', '', $selectedDescription);
            }
        ?>

        <div class="panel">
            <div class="job-details-header">
                <h2 style="color: var(--text); margin: 0;"><?php echo htmlspecialchars($selectedJob['title'] ?? 'Job'); ?></h2>
                <a class="apply-btn" href="#apply-section">Apply Now</a>
            </div>

            <div class="job-meta-grid">
                <div class="job-meta-item">
                    <div class="job-meta-label">Location</div>
                    <div class="job-meta-value"><?php echo htmlspecialchars($selectedLocation ?: '—'); ?></div>
                </div>
                <div class="job-meta-item">
                    <div class="job-meta-label">Posted Date</div>
                    <div class="job-meta-value"><?php echo htmlspecialchars($selectedCreatedAt ?: '—'); ?></div>
                </div>
                <div class="job-meta-item">
                    <div class="job-meta-label">Salary Range</div>
                    <div class="job-meta-value"><?php echo htmlspecialchars($selectedSalary ?: '—'); ?></div>
                </div>
            </div>

            <div class="job-meta-label" style="margin-bottom: 8px;">Job Description</div>
            <div class="job-description"><?php echo $selectedDescription ?: '<span style="color: var(--text-light);">—</span>'; ?></div>
        </div>

        <div id="apply-section" style="margin-top: 22px;" class="panel">
            <h2 style="margin: 0 0 18px; color: var(--primary);">Apply for Job</h2>

            <form id="applyForm" method="POST" action="<?php echo htmlspecialchars($_SERVER['REQUEST_URI']); ?>" enctype="multipart/form-data">
                <input type="hidden" name="job_id" value="<?php echo htmlspecialchars($selectedJob['id']); ?>">
                <input type="hidden" name="apply_job" value="1">
                
                <div class="form-group">
                    <label>Full Name *</label>
                    <input type="text" name="full_name" required placeholder="John Doe">
                </div>
                
                <div class="form-group">
                    <label>Email Address *</label>
                    <input type="email" name="email" required placeholder="john@example.com">
                </div>
                
                <div class="form-group">
                    <label>Phone Number *</label>
                    <input type="text" name="phone" required placeholder="+91 98765 43210">
                </div>

                <div class="form-group">
                    <label>Upload Resume * (PDF or Word)</label>
                    <input type="file" name="resume_file" id="resume_file" accept=".pdf,.doc,.docx" class="file-input" required>
                </div>

                <div class="form-group">
                    <label>Cover Letter / Why should we hire you?</label>
                    <textarea name="cover_letter" rows="4" placeholder="Tell us about your experience..."></textarea>
                </div>
                
                <button type="submit" class="submit-btn">Submit Application</button>
            </form>
        </div>
    <?php else: ?>
        <div class="job-grid">
            <?php if (empty($jobs)): ?>
                <div class="empty-state">
                    <p>No active job openings at the moment. Please check back later.</p>
                </div>
            <?php else: ?>
                <div class="job-head">
                    <div>Job Title</div>
                    <div>Location</div>
                    <div>Posted Date</div>
                    <div style="text-align:right;">View Post</div>
                </div>
                <?php foreach ($jobs as $job): ?>
                    <?php 
                        $title_lower = strtolower($job['title']);
                        $icon_svg = '<path d="M12,2C6.47,2,2,6.47,2,12s4.47,10,10,10s10-4.47,10-10S17.53,2,12,2z M12,20c-4.41,0-8-3.59-8-8s3.59-8,8-8s8,3.59,8,8 S16.41,20,12,20z M15.59,11.59L12,15.17l-3.59-3.58L7,13l5,5l5-5L15.59,11.59z"/>'; // Default

                        if (strpos($title_lower, 'php') !== false) {
                            $icon_svg = '<path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1.8 14.5h-1.6v-5.6H7.1v-1.3h4.7v1.3h-1.6v5.6zm4.1 0h-1.6v-5.6h-1.5v-1.3h4.6v1.3h-1.5v5.6z"/>';
                            $icon_content = '<span style="font-weight:900; font-size: 24px; color: var(--primary);">php</span>';
                        } elseif (strpos($title_lower, 'ios') !== false || strpos($title_lower, 'iphone') !== false) {
                            $icon_svg = '<path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.1 2.48-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.36 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>';
                        } elseif (strpos($title_lower, 'android') !== false) {
                            $icon_svg = '<path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.2-1.2c.35-.35.35-.91 0-1.25-.35-.35-.91-.35-1.25 0l-1.58 1.58C13.04 1.09 11.55 1 10.11 1c-1.46 0-2.97.09-3.87.3l-1.58-1.58c-.35-.35-.91-.35-1.25 0-.35.35-.35.91 0 1.25l1.2 1.2C3.12 3.3 2.09 5.01 2.01 7h15.98c-.08-1.99-1.11-3.7-2.63-4.84zM7 5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>';
                        } elseif (strpos($title_lower, 'python') !== false) {
                            $icon_svg = '<path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.38.31-.44.25-.51.17-.57.1-.64.03h-2v4.5l.07.41.13.34.22.28.3.21.31.12.32.06.4.02h2.5l.34.02.31.06.28.12.22.18.15.26.09.3.03.42V20l-.02.3-.08.32-.14.3-.22.27-.3.21-.4.15-.5.09-.6.04H12l-.6-.04-.5-.09-.4-.15-.3-.21-.22-.27-.14-.3-.08-.32-.02-.3v-1.6l.01-.13.02-.2.04-.26.1-.3.16-.33.25-.34.34-.34.45-.32.59-.3.73-.26.9-.2.17-.03h1.1l.4-.02.4-.05.3-.11.2-.15.07-.26.01-.3V14h-4l-.63-.05-.55-.13-.46-.21-.38-.26-.31-.38-.25-.44-.17-.51-.1-.57-.03-.64V9.5l.04-.6.09-.5.15-.4.21-.3.27-.22.3-.14.32-.08.3-.02H15l.6-.04.5-.09.4-.15.3-.21.22-.27.14-.3.08-.32.02-.3V4.4l-.01-.13-.02-.2-.04-.26-.1-.3-.16-.33-.25-.34-.34-.34-.45-.32-.59-.3-.73-.26-.9-.2-.17-.03H10.1l-.4.02-.4.05-.3.11-.2.15-.07.26-.01.3v1.2H7.6l-.34.02-.31.06-.28.12-.22.18-.15.26-.09.3-.03.42V10l.02.3.08.32.14.3.22.27.3.21.4.15.5.09.6.04H12l.6-.04.5-.09.4-.15.3-.21.22-.27.14-.3.08-.32.02-.3V4.5l-.07-.41-.13-.34-.22-.28-.3-.21-.31-.12-.32-.06-.4-.02H8.5l-.34-.02-.31-.06-.28-.12-.22-.18-.15-.26-.09-.3-.03-.42V4l.02-.3.08-.32.14-.3.22-.27.3-.21.4-.15.5-.09.6-.04H12l.6.04.5.09.4.15.3.21.22.27.14.3.08.32.02.3v1.6l-.01.13-.02.2-.04.26-.1.3-.16.33-.25.34-.34.34-.45.32-.59.3-.73.26-.9.2-.17.03H8.9l-.4.02-.4.05-.3.11-.2.15-.07.26-.01.3v1.2H4.4l-.34.02-.31.06-.28.12-.22.18-.15.26-.09.3-.03.42V10l.02.3.08.32.14.3.22.27.3.21.4.15.5.09.6.04H8l.63.05.55.13.46.21.38.26.31.38.25.44.17.51.1.57.03.64v4l-.04.6-.09.5-.15.4-.21.3-.27.22-.3.14-.32.08-.3.02H9l-.6.04-.5.09-.4.15-.3.21-.22.27-.14.3-.08.32-.02.3v1.6l.01.13.02.2.04.26.1.3.16.33.25.34.34.34.45.32.59.3.73.26.9.2.17.03h1.1l.4-.02.4-.05.3-.11.2-.15.07-.26.01-.3V15h4.1l.34-.02.31-.06.28-.12.22-.18.15-.26.09-.3.03-.42V10l-.02-.3-.08-.32-.14-.3-.22-.27-.3-.21-.4-.15-.5-.09-.6-.04H12l-.63-.05-.55-.13-.46-.21-.38-.26-.31-.38-.25-.44-.17-.51-.1-.57-.03-.64V5.5l.04-.6.09-.5.15-.4.21-.3.27-.22.3-.14.32-.08.3-.02H15z"/>';
                        } elseif (strpos($title_lower, 'content') !== false || strpos($title_lower, 'writer') !== false) {
                            $icon_svg = '<path d="M14,2H6C4.9,2,4,2.9,4,4v16c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V8L14,2z M13,9V3.5L18.5,9H13z M16,16H8v-2h8V16z M16,12H8v-2h8 V12z M16,20H8v-2h8V20z"/>';
                        } elseif (strpos($title_lower, 'marketing') !== false || strpos($title_lower, 'seo') !== false) {
                            $icon_svg = '<path d="M12,2C6.47,2,2,6.47,2,12s4.47,10,10,10s10-4.47,10-10S17.53,2,12,2z M13,17h-2v-2h2V17z M13,13h-2V7h2V13z"/>';
                        } elseif (strpos($title_lower, 'business') !== false || strpos($title_lower, 'bd') !== false) {
                            $icon_svg = '<path d="M12,12c2.21,0,4-1.79,4-4s-1.79-4-4-4S8,5.79,8,8S9.79,12,12,12z M12,14c-2.67,0-8,1.34-8,4v2h16v-2C20,15.34,14.67,14,12,14z"/>';
                        }

                        $location = $job['location'] ?? '';
                        $createdAtRaw = $job['createdAt'] ?? ($job['created_at'] ?? '');
                        $createdAt = '';
                        if (!empty($createdAtRaw)) {
                            $ts = strtotime($createdAtRaw);
                            if ($ts !== false) $createdAt = date('d M Y', $ts);
                        }
                    ?>
                    <div class="job-row">
                        <div class="job-title-cell">
                            <div class="job-icon">
                                <svg viewBox="0 0 24 24"><?php echo $icon_svg; ?></svg>
                            </div>
                            <h2 class="job-title"><?php echo htmlspecialchars($job['title']); ?></h2>
                        </div>
                        <div class="job-cell"><?php echo htmlspecialchars($location ?: '—'); ?></div>
                        <div class="job-cell"><?php echo htmlspecialchars($createdAt ?: '—'); ?></div>
                        <a class="view-btn" href="careers2.php?job=<?php echo urlencode($job['id']); ?>">View Post</a>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    <?php endif; ?>
</div>

<script>
    const applyForm = document.getElementById('applyForm');
    if (applyForm) {
        applyForm.onsubmit = function(e) {
            const file = document.getElementById('resume_file')?.value || '';
            if (!file) {
                alert('Please upload your resume file.');
                e.preventDefault();
                return false;
            }
            return true;
        };
    }
</script>

</body>
</html>

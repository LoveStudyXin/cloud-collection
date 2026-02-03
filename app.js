// 云朵收集器 - 云朵卡牌收集应用
// 使用阿里云百炼 qwen3-vl-plus 模型进行云朵识别

document.addEventListener('DOMContentLoaded', function() {
    // DOM 元素
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const previewImage = document.getElementById('previewImage');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const clearBtn = document.getElementById('clearBtn');
    const recognizeBtn = document.getElementById('recognizeBtn');
    const resultSection = document.getElementById('resultSection');
    const apiKeyModal = document.getElementById('apiKeyModal');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveApiBtn = document.getElementById('saveApiBtn');
    const cancelApiBtn = document.getElementById('cancelApiBtn');

    // 状态
    let currentImageBase64 = null;
    let apiKey = localStorage.getItem('dashscope_api_key') || '';
    let currentRecognitionResult = null;
    let collection = JSON.parse(localStorage.getItem('cloud_collection') || '[]');
    // 图鉴点亮记录：{ cloudId: { count: 次数, firstLitAt: 时间, lastLitAt: 时间 } }
    let guideRecords = JSON.parse(localStorage.getItem('cloud_guide_records') || '{}');

    // 清理旧数据中的 images 字段（释放 localStorage 空间）
    (function cleanupOldImageData() {
        let needsCleanup = false;
        Object.keys(guideRecords).forEach(key => {
            if (guideRecords[key].images) {
                delete guideRecords[key].images;
                needsCleanup = true;
            }
        });
        if (needsCleanup) {
            try {
                localStorage.setItem('cloud_guide_records', JSON.stringify(guideRecords));
                console.log('✅ 已清理旧的图片缓存数据，释放存储空间');
            } catch (e) {
                console.warn('清理缓存失败:', e);
            }
        }
    })();

    // 云族配置（用于成就墙分区）
    const CLOUD_FAMILY_CONFIG = {
        low: { name: '低云族', icon: '🌥️', desc: '海拔 < 2000米' },
        middle: { name: '中云族', icon: '⛅', desc: '海拔 2000-6000米' },
        high: { name: '高云族', icon: '🌤️', desc: '海拔 > 6000米' },
        vertical: { name: '垂直发展云', icon: '⛈️', desc: '跨越多层高度' },
        special: { name: '特殊云', icon: '✨', desc: '罕见气象奇观' }
    };

    // 稀有度配置 - 天空夕阳色调
    const RARITY_CONFIG = {
        common: { name: '普通', minScore: 0, maxScore: 10, color: '#a0b8c8' },
        uncommon: { name: '稀有', minScore: 11, maxScore: 20, color: '#a8c5b5' },
        rare: { name: '史诗', minScore: 21, maxScore: 35, color: '#87ceeb' },
        epic: { name: '传说', minScore: 36, maxScore: 50, color: '#c5b8d8' },
        legendary: { name: '神话', minScore: 51, maxScore: 100, color: '#f5d5a0' }
    };

    // 阿里云百炼 API 配置
    const API_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    const MODEL_NAME = 'qwen-vl-plus';

    // 云朵识别提示词
    const CLOUD_RECOGNITION_PROMPT = `你是一位专业的云彩识别专家，精通《云彩收集者手册》中的所有云彩分类知识。

请仔细分析这张云朵图片，按照以下格式输出识别结果：

**云族**：[云族名称]（简要说明云体所在的高度范围和类型特征）

**云属**：[云属名称]（说明云的基本类型和主要特征）

**云种/变种**：[具体云种名称]（详细描述该云种的特征，包括云体的形态、厚度、颜色等，以及与其他相近云种的区别）

**识别特征**：[详细描述图中云朵的视觉特征，包括形态、颜色、纹理、边界等]

**天气预兆**：[说明这种云可能预示的天气变化和发展趋势]

**知识延伸**：[介绍该云种的形成原因、与其他云种的关系，以及在气象观测中的意义]

云彩分类参考：
- 低云族（<2000米）：积云、层积云、层云
- 中云族（2000-6000米）：高积云、高层云
- 高云族（>6000米）：卷云、卷积云、卷层云
- 垂直发展云：雨层云、积雨云（可跨越多个高度层）
- 特殊云：荚状云、山帽云、旗云、航迹云、悬球状云等

请基于图片中云朵的实际特征进行专业分析，给出准确的识别结果。`;

    // 预览容器
    const previewContainer = document.getElementById('previewContainer');

    // 事件绑定 - 点击上传区域（只在没有图片时触发）
    uploadArea.addEventListener('click', (e) => {
        // 如果点击的是关闭按钮或预览容器内部，不触发上传
        if (e.target.closest('.preview-close-btn') || (previewContainer.style.display !== 'none' && e.target.closest('.preview-container'))) {
            return;
        }
        // 如果已有图片，点击图片区域也打开文件选择（可以重新选择）
        fileInput.click();
    });

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageUpload(file);
        }
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleImageUpload(file);
        }
    });

    clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetUpload();
    });

    recognizeBtn.addEventListener('click', () => {
        recognizeCloud();
    });

    // API Key 弹窗事件
    saveApiBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (key) {
            apiKey = key;
            localStorage.setItem('dashscope_api_key', key);
            hideApiKeyModal();
            recognizeCloud();
        } else {
            alert('请输入有效的 API Key');
        }
    });

    cancelApiBtn.addEventListener('click', () => {
        hideApiKeyModal();
    });

    // 收集按钮事件
    const collectBtn = document.getElementById('collectBtn');
    collectBtn.addEventListener('click', () => {
        if (currentRecognitionResult && currentImageBase64) {
            addToCollection(currentRecognitionResult, currentImageBase64);
        }
    });

    // 详细信息折叠（如果存在）
    const expandToggle = document.getElementById('expandToggle');
    const expandContent = document.getElementById('expandContent');
    if (expandToggle && expandContent) {
        expandToggle.addEventListener('click', () => {
            const isExpanded = expandContent.style.display !== 'none';
            expandContent.style.display = isExpanded ? 'none' : 'block';
            expandToggle.classList.toggle('active', !isExpanded);
        });
    }

    // 图鉴标签切换（已移除，改用成就墙）

    // 图片上传处理
    function handleImageUpload(file) {
        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件');
            return;
        }

        // 检查文件大小（限制 10MB）
        if (file.size > 10 * 1024 * 1024) {
            alert('图片文件过大，请选择小于 10MB 的图片');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Data = e.target.result;

            // 确保是有效的 base64 图片数据
            if (!base64Data || !base64Data.startsWith('data:image')) {
                alert('无法读取图片数据，请尝试其他图片');
                return;
            }

            // 先隐藏预览区域
            previewContainer.style.display = 'none';
            uploadPlaceholder.style.display = 'flex';

            // 直接设置图片，监听 previewImage 的加载事件
            previewImage.onload = function() {
                currentImageBase64 = base64Data;
                previewContainer.style.display = 'flex';
                uploadPlaceholder.style.display = 'none';
                uploadArea.classList.add('has-image');
                recognizeBtn.disabled = false;
                // 清除事件监听，避免重复触发
                previewImage.onload = null;
                previewImage.onerror = null;
            };
            previewImage.onerror = function() {
                console.error('图片加载失败');
                alert('图片加载失败，请尝试其他格式的图片（JPG/PNG/WEBP）');
                resetUpload();
                previewImage.onload = null;
                previewImage.onerror = null;
            };
            previewImage.src = base64Data;
        };
        reader.onerror = () => {
            console.error('FileReader 错误:', reader.error);
            alert('文件读取失败，请重试');
        };
        reader.readAsDataURL(file);
    }

    // 重置上传
    function resetUpload() {
        currentImageBase64 = null;
        previewImage.src = '';
        previewContainer.style.display = 'none';
        uploadPlaceholder.style.display = 'flex';
        uploadArea.classList.remove('has-image');
        fileInput.value = '';
        recognizeBtn.disabled = true;
        resultSection.style.display = 'none';
    }

    // 显示 API Key 弹窗
    function showApiKeyModal() {
        apiKeyInput.value = apiKey;
        apiKeyModal.style.display = 'flex';
    }

    // 隐藏 API Key 弹窗
    function hideApiKeyModal() {
        apiKeyModal.style.display = 'none';
    }

    // 云朵识别
    async function recognizeCloud() {
        if (!currentImageBase64) {
            alert('请先上传云朵图片');
            return;
        }

        // 检查 API Key
        if (!apiKey) {
            showApiKeyModal();
            return;
        }

        // 设置加载状态
        setLoading(true);

        try {
            const result = await callQwenVLAPI(currentImageBase64);
            displayResult(result);
        } catch (error) {
            console.error('识别失败:', error);
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                alert('API Key 无效，请重新设置');
                showApiKeyModal();
            } else {
                alert('识别失败: ' + error.message);
            }
        } finally {
            setLoading(false);
        }
    }

    // 调用通义千问视觉 API
    async function callQwenVLAPI(imageBase64) {
        const response = await fetch(`${API_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'image_url',
                                image_url: {
                                    url: imageBase64
                                }
                            },
                            {
                                type: 'text',
                                text: CLOUD_RECOGNITION_PROMPT
                            }
                        ]
                    }
                ],
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API 请求失败 (${response.status})`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        return parseRecognitionResult(content);
    }

    // 解析识别结果
    function parseRecognitionResult(content) {
        const result = {
            family: '',
            genus: '',
            species: '',
            features: '',
            weather: '',
            knowledge: '',
            score: 10
        };

        // 解析各个字段
        const familyMatch = content.match(/\*\*云族\*\*[：:]\s*([\s\S]*?)(?=\*\*云属\*\*|$)/);
        const genusMatch = content.match(/\*\*云属\*\*[：:]\s*([\s\S]*?)(?=\*\*云种[/／]变种\*\*|$)/);
        const speciesMatch = content.match(/\*\*云种[/／]变种\*\*[：:]\s*([\s\S]*?)(?=\*\*识别特征\*\*|$)/);
        const featuresMatch = content.match(/\*\*识别特征\*\*[：:]\s*([\s\S]*?)(?=\*\*天气预兆\*\*|$)/);
        const weatherMatch = content.match(/\*\*天气预兆\*\*[：:]\s*([\s\S]*?)(?=\*\*知识延伸\*\*|$)/);
        const knowledgeMatch = content.match(/\*\*知识延伸\*\*[：:]\s*([\s\S]*?)$/);

        if (familyMatch) result.family = familyMatch[1].trim();
        if (genusMatch) result.genus = genusMatch[1].trim();
        if (speciesMatch) result.species = speciesMatch[1].trim();
        if (featuresMatch) result.features = featuresMatch[1].trim();
        if (weatherMatch) result.weather = weatherMatch[1].trim();
        if (knowledgeMatch) result.knowledge = knowledgeMatch[1].trim();

        // 根据云种计算评分
        result.score = calculateScore(result.genus, result.species);

        return result;
    }

    // 计算评分
    function calculateScore(genus, species) {
        const text = (genus + ' ' + species).toLowerCase();

        // 极罕见云
        if (text.includes('开尔文') || text.includes('亥姆霍兹')) return 55;

        // 罕见云
        if (text.includes('马蹄涡') || text.includes('贝母') || text.includes('夜光')) return 45;

        // 少见云
        if (text.includes('雨幡洞') || text.includes('悬球') || text.includes('滚轴')) return 35;

        // 较少见云
        if (text.includes('荚状') || text.includes('虹彩') || text.includes('卷积')) return 20;

        // 较常见云
        if (text.includes('积雨') || text.includes('浓积')) return 15;

        // 常见云
        return 10;
    }

    // 根据分数获取稀有度
    function getRarityByScore(score) {
        if (score >= RARITY_CONFIG.legendary.minScore) return 'legendary';
        if (score >= RARITY_CONFIG.epic.minScore) return 'epic';
        if (score >= RARITY_CONFIG.rare.minScore) return 'rare';
        if (score >= RARITY_CONFIG.uncommon.minScore) return 'uncommon';
        return 'common';
    }

    // 显示结果 - 改为显示翻卡弹窗
    function displayResult(result) {
        currentRecognitionResult = result;
        const rarity = getRarityByScore(result.score);
        const rarityName = RARITY_CONFIG[rarity].name;
        const cloudName = extractCloudName(result.genus);

        // 显示翻卡弹窗
        showFlipCardModal(result, rarity, rarityName, cloudName);

        // 同时更新结果区域（用于查看详情时显示）
        updateResultSection(result, rarity, rarityName, cloudName);
    }

    // 显示翻卡弹窗
    function showFlipCardModal(result, rarity, rarityName, cloudName) {
        const flipCardOverlay = document.getElementById('flipCardOverlay');
        const flipCard = document.getElementById('flipCard');
        const flipCardFront = flipCard.querySelector('.flip-card-front');
        const flipCardRarity = document.getElementById('flipCardRarity');
        const flipCardImage = document.getElementById('flipCardImage');
        const flipCardName = document.getElementById('flipCardName');
        const flipCardGenus = document.getElementById('flipCardGenus');
        const flipCardScore = document.getElementById('flipCardScore');
        const flipCardActions = document.getElementById('flipCardActions');
        const collectBtnModal = document.getElementById('collectBtnModal');

        // 重置卡牌状态
        flipCard.classList.remove('flipped');
        flipCardActions.style.display = 'none';
        // 重置提示文字
        const flipCardHint = document.querySelector('.flip-card-hint');
        if (flipCardHint) {
            flipCardHint.style.display = 'block';
        }

        // 设置卡牌正面内容
        flipCardFront.className = 'flip-card-face flip-card-front rarity-' + rarity;
        flipCardRarity.className = 'flip-card-rarity rarity-' + rarity;
        flipCardRarity.textContent = rarityName;
        flipCardImage.src = currentImageBase64;
        flipCardName.textContent = cloudName;
        flipCardGenus.textContent = result.genus || '--';
        flipCardScore.textContent = result.score;

        // 检查点亮状态
        const cloudId = findCloudIdByName(cloudName);
        const record = guideRecords[cloudId];

        if (record && record.count > 0) {
            collectBtnModal.textContent = `再次点亮 (已×${record.count})`;
            collectBtnModal.classList.remove('collected');
        } else {
            collectBtnModal.textContent = '点亮图鉴';
            collectBtnModal.classList.remove('collected');
        }

        // 显示弹窗
        flipCardOverlay.style.display = 'flex';

        // 保存当前稀有度供庆祝动画使用
        flipCard.dataset.rarity = rarity;
    }

    // 翻卡点击处理函数
    function handleFlipCardClick(e) {
        const flipCard = document.getElementById('flipCard');
        const flipCardActions = document.getElementById('flipCardActions');
        const flipCardHint = document.querySelector('.flip-card-hint');

        // 阻止事件冒泡
        e.stopPropagation();

        if (!flipCard.classList.contains('flipped')) {
            flipCard.classList.add('flipped');
            // 隐藏提示文字
            if (flipCardHint) {
                flipCardHint.style.display = 'none';
            }
            // 翻转后显示按钮
            setTimeout(() => {
                flipCardActions.style.display = 'flex';
                // 触发庆祝动画
                const rarity = flipCard.dataset.rarity || 'common';
                showCelebration(rarity);
            }, 600);
        }
    }

    // 翻卡点击事件绑定
    const flipCardElement = document.getElementById('flipCard');
    if (flipCardElement) {
        flipCardElement.addEventListener('click', handleFlipCardClick);
    }

    // 更新结果区域（用于详情展示）
    function updateResultSection(result, rarity, rarityName, cloudName) {
        const cloudCard = document.getElementById('cloudCard');
        const rarityBanner = document.getElementById('rarityBanner');
        const cardImage = document.getElementById('cardImage');

        cloudCard.className = 'cloud-card rarity-' + rarity;
        rarityBanner.className = 'card-rarity-banner rarity-' + rarity;
        rarityBanner.innerHTML = `<span>${rarityName}</span>`;
        cardImage.src = currentImageBase64;

        document.getElementById('cardName').textContent = cloudName;
        document.getElementById('cardGenus').textContent = result.genus || '--';
        document.getElementById('cloudFamily').textContent = result.family || '--';
        document.getElementById('cloudGenusDetail').textContent = result.genus || '--';
        document.getElementById('cloudSpecies').textContent = result.species || '--';
        document.getElementById('cloudFeatures').textContent = result.features || '--';
        document.getElementById('cloudWeather').textContent = result.weather || '--';
        document.getElementById('cloudKnowledge').textContent = result.knowledge || '--';
        document.querySelector('.card-score .score-num').textContent = result.score;

        const cloudId = findCloudIdByName(cloudName);
        const record = guideRecords[cloudId];
        const collectBtn = document.getElementById('collectBtn');

        if (record && record.count > 0) {
            collectBtn.innerHTML = `<span>再次点亮 (已×${record.count})</span>`;
            collectBtn.classList.remove('collected');
            collectBtn.disabled = false;
        } else {
            collectBtn.innerHTML = '<span>点亮图鉴</span>';
            collectBtn.classList.remove('collected');
            collectBtn.disabled = false;
        }
    }

    // 关闭翻卡弹窗
    function closeFlipCardModal() {
        const flipCardOverlay = document.getElementById('flipCardOverlay');
        flipCardOverlay.style.display = 'none';
    }

    // 翻卡弹窗中的点亮按钮事件
    const collectBtnModal = document.getElementById('collectBtnModal');
    if (collectBtnModal) {
        collectBtnModal.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            if (currentRecognitionResult && currentImageBase64) {
                const cloudName = extractCloudName(currentRecognitionResult.genus);
                const cloudId = findCloudIdByName(cloudName);
                const rarity = getRarityByScore(currentRecognitionResult.score);

                // 在关闭弹窗前获取翻卡位置
                const flipCard = document.getElementById('flipCard');
                let startPosition = null;
                if (flipCard) {
                    const flipRect = flipCard.getBoundingClientRect();
                    startPosition = {
                        x: flipRect.left + flipRect.width / 2,
                        y: flipRect.top + flipRect.height / 2
                    };
                }

                // 先关闭弹窗再执行飞入动画
                closeFlipCardModal();

                // 短暂延迟后执行飞入动画
                setTimeout(() => {
                    playFlyToGuideAnimation(cloudId, rarity, startPosition, () => {
                        addToCollection(currentRecognitionResult, currentImageBase64);
                    });
                }, 100);
            }
        });
    }

    // 翻卡弹窗中的查看详情按钮事件
    const detailBtn = document.getElementById('detailBtn');
    if (detailBtn) {
        detailBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeFlipCardModal();
            resultSection.style.display = 'block';
            resultSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // 卡牌飞入图鉴动画
    // startPosition: 可选的起始位置 { x, y }，如果不传则使用屏幕中央
    function playFlyToGuideAnimation(cloudId, rarity, startPosition, callback) {
        const flyingCard = document.getElementById('flyingCard');
        const flyingCardIcon = document.getElementById('flyingCardIcon');
        const targetCard = document.querySelector(`.guide-card[data-cloud-id="${cloudId}"]`);

        // 如果找不到目标卡牌，直接执行回调
        if (!targetCard || !cloudId) {
            if (callback) callback();
            return;
        }

        // 找到对应云朵的图标
        const cloud = findCloudById(cloudId);
        flyingCardIcon.textContent = cloud ? cloud.icon : '☁️';

        // 设置稀有度样式
        flyingCard.className = 'flying-card rarity-' + rarity;

        // 起始位置：优先使用传入的位置，否则使用屏幕中央
        let startX, startY;
        if (startPosition && startPosition.x && startPosition.y) {
            startX = startPosition.x - 40;  // 40 是卡牌宽度的一半
            startY = startPosition.y - 50;  // 50 是卡牌高度的一半
        } else {
            // 降级方案：屏幕中央
            startX = window.innerWidth / 2 - 40;
            startY = window.innerHeight / 2 - 50;
        }

        // 设置起始位置并显示飞行卡牌
        flyingCard.style.left = startX + 'px';
        flyingCard.style.top = startY + 'px';
        flyingCard.style.display = 'flex';
        flyingCard.style.transform = 'scale(1)';
        flyingCard.style.opacity = '1';
        flyingCard.style.transition = 'none';

        // 滚动到图鉴区域让目标卡牌可见
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // 等待滚动完成后再计算目标位置
        setTimeout(() => {
            // 重新获取目标卡牌的最新位置（滚动后）
            const latestTargetCard = document.querySelector(`.guide-card[data-cloud-id="${cloudId}"]`);
            if (!latestTargetCard) {
                flyingCard.style.display = 'none';
                if (callback) callback();
                return;
            }

            const endRect = latestTargetCard.getBoundingClientRect();
            const endX = endRect.left + endRect.width / 2 - 40;
            const endY = endRect.top + endRect.height / 2 - 50;

            // 执行飞入动画
            requestAnimationFrame(() => {
                flyingCard.style.transition = 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)';
                flyingCard.style.left = endX + 'px';
                flyingCard.style.top = endY + 'px';
                flyingCard.style.transform = 'scale(0.4)';
                flyingCard.style.opacity = '0.8';
            });

            // 动画结束后
            setTimeout(() => {
                flyingCard.style.display = 'none';
                flyingCard.style.transition = 'none';

                // 先执行回调（更新数据并重新渲染图鉴）
                if (callback) callback();

                // 回调后重新查找新渲染的卡牌元素并添加高亮效果
                requestAnimationFrame(() => {
                    const newTargetCard = document.querySelector(`.guide-card[data-cloud-id="${cloudId}"]`);
                    if (newTargetCard) {
                        // 确保卡牌可见
                        newTargetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

                        // 强制重绘后添加高亮动画效果
                        requestAnimationFrame(() => {
                            newTargetCard.classList.add('highlight-target');
                            newTargetCard.classList.add('lighting-up');

                            setTimeout(() => {
                                newTargetCard.classList.remove('highlight-target');
                                newTargetCard.classList.remove('lighting-up');
                            }, 800);
                        });
                    }
                });
            }, 700);
        }, 400); // 等待滚动完成
    }

    // 从文本中提取云名称
    function extractCloudName(text) {
        if (!text) return '未知云';

        // 定义所有已知云朵名称（按长度排序，优先匹配长名称）
        const knownCloudNames = [
            '开尔文-亥姆霍兹波', '开尔文亥姆霍兹波',
            '雨幡洞云', '悬球状云', '马蹄涡', '滚轴云', '夜光云', '贝母云', '虹彩云', '航迹云',
            '荚状云', '山帽云', '旗云', '积雨云', '雨层云',
            '层积云', '高积云', '高层云', '卷积云', '卷层云',
            '积云', '层云', '卷云', '雾'
        ];

        // 先尝试精确匹配已知云名
        for (const name of knownCloudNames) {
            if (text.includes(name)) {
                return name;
            }
        }

        // 尝试提取中文云名称
        const match = text.match(/([积层卷雨高荚状悬球滚轴马蹄涡贝母夜光虹彩航迹雾幡洞开尔文亥姆霍兹波]+云|[积层卷雨高荚状悬球滚轴]+)/);
        if (match) return match[1].endsWith('云') ? match[1] : match[1] + '云';

        // 返回前几个字（去除括号内内容）
        return text.split(/[（(]/)[0].trim().substring(0, 6) || '云';
    }

    // 从文本中提取简短内容
    function extractSimpleText(text) {
        if (!text) return '--';
        // 取第一句或括号前的内容
        return text.split(/[。（(]/)[0].trim();
    }

    // 添加到收藏（点亮图鉴）
    function addToCollection(result, imageBase64) {
        const cloudName = extractCloudName(result.genus);
        const rarity = getRarityByScore(result.score);

        // 找到对应的图鉴卡牌ID
        const cloudId = findCloudIdByName(cloudName);

        // 更新图鉴记录（不存储图片，避免超出 localStorage 配额）
        if (cloudId) {
            if (!guideRecords[cloudId]) {
                guideRecords[cloudId] = {
                    count: 0,
                    firstLitAt: new Date().toISOString()
                };
            }
            // 如果旧数据有 images 字段，删除它以释放空间
            if (guideRecords[cloudId].images) {
                delete guideRecords[cloudId].images;
            }
            guideRecords[cloudId].count += 1;
            guideRecords[cloudId].lastLitAt = new Date().toISOString();

            try {
                localStorage.setItem('cloud_guide_records', JSON.stringify(guideRecords));
            } catch (e) {
                console.warn('localStorage 存储失败，尝试清理旧数据...');
                // 清理所有记录中的 images 字段
                Object.keys(guideRecords).forEach(key => {
                    if (guideRecords[key].images) {
                        delete guideRecords[key].images;
                    }
                });
                try {
                    localStorage.setItem('cloud_guide_records', JSON.stringify(guideRecords));
                } catch (e2) {
                    console.error('存储仍然失败:', e2);
                }
            }
        }

        // 同时保存到收藏（保持兼容）
        const existingIndex = collection.findIndex(item => item.name === cloudName);
        if (existingIndex === -1) {
            const cardData = {
                id: Date.now(),
                name: cloudName,
                cloudId: cloudId,
                genus: result.genus,
                family: extractSimpleText(result.family),
                species: extractSimpleText(result.species),
                features: result.features,
                weather: result.weather,
                knowledge: result.knowledge,
                score: result.score,
                rarity: rarity,
                image: imageBase64,
                collectedAt: new Date().toISOString()
            };
            collection.push(cardData);
        } else {
            // 更新图片为最新的
            collection[existingIndex].image = imageBase64;
        }
        localStorage.setItem('cloud_collection', JSON.stringify(collection));

        // 更新按钮状态
        const collectBtn = document.getElementById('collectBtn');
        const litCount = guideRecords[cloudId]?.count || 1;
        collectBtn.innerHTML = `<span>已点亮 ×${litCount}</span>`;
        collectBtn.classList.add('collected');
        collectBtn.disabled = true;

        // 刷新图鉴展示
        renderGuideCards();

        // 显示收集成功动画/提示
        showCollectSuccess(cloudName, rarity, litCount);
    }

    // 颜色调整辅助函数
    function adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const num = parseInt(hex, 16);
        const r = Math.min(255, Math.max(0, (num >> 16) + amount));
        const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
        const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }

    // 根据云名称找到图鉴中的云ID
    function findCloudIdByName(name) {
        if (!name) return null;

        // 名称标准化：去除多余空格，处理特殊字符
        const normalizedName = name.trim().replace(/\s+/g, '');

        // 定义名称映射（处理各种变体）
        const nameAliases = {
            '开尔文-亥姆霍兹波': 'kelvin_helmholtz',
            '开尔文亥姆霍兹波': 'kelvin_helmholtz',
            'KH波': 'kelvin_helmholtz',
            '积云': 'cumulus',
            '层积云': 'stratocumulus',
            '层云': 'stratus',
            '高积云': 'altocumulus',
            '高层云': 'altostratus',
            '卷云': 'cirrus',
            '卷积云': 'cirrocumulus',
            '卷层云': 'cirrostratus',
            '雨层云': 'nimbostratus',
            '积雨云': 'cumulonimbus',
            '荚状云': 'lenticular',
            '山帽云': 'cap_cloud',
            '旗云': 'banner_cloud',
            '航迹云': 'contrail',
            '悬球状云': 'mammatus',
            '悬球云': 'mammatus',
            '乳状云': 'mammatus',
            '滚轴云': 'roll_cloud',
            '马蹄涡': 'horseshoe_vortex',
            '雨幡洞云': 'fallstreak_hole',
            '穿洞云': 'fallstreak_hole',
            '贝母云': 'nacreous',
            '珠母云': 'nacreous',
            '夜光云': 'noctilucent',
            '虹彩云': 'iridescent',
            '彩云': 'iridescent',
            '雾': 'fog'
        };

        // 1. 首先尝试直接别名匹配
        if (nameAliases[normalizedName]) {
            return nameAliases[normalizedName];
        }

        // 2. 尝试精确名称匹配
        for (const category of Object.values(CLOUD_DATABASE)) {
            for (const cloud of category) {
                if (cloud.name === normalizedName) {
                    return cloud.id;
                }
            }
        }

        // 3. 尝试包含匹配（输入名称包含数据库云名或反之）
        for (const category of Object.values(CLOUD_DATABASE)) {
            for (const cloud of category) {
                if (normalizedName.includes(cloud.name) || cloud.name.includes(normalizedName)) {
                    return cloud.id;
                }
            }
        }

        // 4. 去除"云"字后模糊匹配
        const simpleName = normalizedName.replace(/云$/, '');
        if (simpleName) {
            for (const category of Object.values(CLOUD_DATABASE)) {
                for (const cloud of category) {
                    const cloudSimpleName = cloud.name.replace(/云$/, '');
                    if (simpleName.includes(cloudSimpleName) || cloudSimpleName.includes(simpleName)) {
                        return cloud.id;
                    }
                }
            }
        }

        // 5. 检查别名表的部分匹配
        for (const [alias, id] of Object.entries(nameAliases)) {
            if (normalizedName.includes(alias) || alias.includes(normalizedName)) {
                return id;
            }
        }

        return null;
    }

    // 显示收集成功提示
    function showCollectSuccess(name, rarity, litCount = 1) {
        const rarityName = RARITY_CONFIG[rarity].name;
        const isRepeat = litCount > 1;
        const toast = document.createElement('div');
        toast.className = 'collect-toast rarity-' + rarity;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${isRepeat ? '🔥' : '✨'}</span>
                <span class="toast-text">${isRepeat ? `再次点亮【${rarityName}】${name} ×${litCount}` : `恭喜点亮【${rarityName}】${name}！`}</span>
            </div>
        `;
        toast.style.cssText = `
            position: fixed;
            top: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, ${RARITY_CONFIG[rarity].color}, ${adjustColor(RARITY_CONFIG[rarity].color, -20)});
            color: white;
            padding: 16px 32px;
            border-radius: 50px;
            font-weight: 700;
            font-size: 1rem;
            z-index: 2000;
            animation: toastIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), toastOut 0.3s ease 2.2s forwards;
            box-shadow: 0 8px 30px rgba(0,0,0,0.2);
            backdrop-filter: blur(10px);
            letter-spacing: 0.5px;
        `;
        document.body.appendChild(toast);

        // 添加动画样式
        if (!document.getElementById('toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                @keyframes toastIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                @keyframes toastOut {
                    from { opacity: 1; transform: translateX(-50%) translateY(0); }
                    to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                }
            `;
            document.head.appendChild(style);
        }

        // 触发庆祝动画
        showCelebration(rarity);

        setTimeout(() => toast.remove(), 2500);
    }

    // 庆祝动画 - 星星飘落
    function showCelebration(rarity) {
        const container = document.createElement('div');
        container.className = 'celebration-container';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1999;
            overflow: hidden;
        `;
        document.body.appendChild(container);

        // 根据稀有度决定星星数量
        const starCounts = {
            common: 8,
            uncommon: 12,
            rare: 18,
            epic: 25,
            legendary: 35
        };
        const count = starCounts[rarity] || 12;
        const color = RARITY_CONFIG[rarity].color;

        // 星星符号
        const symbols = ['✦', '✧', '★', '☆', '⭐', '✨'];

        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            const symbol = symbols[Math.floor(Math.random() * symbols.length)];
            const startX = Math.random() * 100;
            const delay = Math.random() * 0.5;
            const duration = 1.5 + Math.random() * 1;
            const size = 0.8 + Math.random() * 0.8;
            const drift = (Math.random() - 0.5) * 100;

            star.textContent = symbol;
            star.style.cssText = `
                position: absolute;
                top: -20px;
                left: ${startX}%;
                font-size: ${size}rem;
                color: ${color};
                opacity: 0;
                animation: starFall ${duration}s ease-out ${delay}s forwards;
                text-shadow: 0 0 10px ${color};
                --drift: ${drift}px;
            `;
            container.appendChild(star);
        }

        // 添加星星飘落动画
        if (!document.getElementById('celebration-styles')) {
            const style = document.createElement('style');
            style.id = 'celebration-styles';
            style.textContent = `
                @keyframes starFall {
                    0% {
                        opacity: 1;
                        transform: translateY(0) translateX(0) rotate(0deg) scale(0);
                    }
                    10% {
                        transform: translateY(10vh) translateX(calc(var(--drift) * 0.1)) rotate(36deg) scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: translateY(100vh) translateX(var(--drift)) rotate(360deg) scale(0.5);
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // 移除容器
        setTimeout(() => container.remove(), 3000);
    }

    // 获取所有云朵数据（扁平化）
    function getAllClouds() {
        const allClouds = [];
        Object.entries(CLOUD_DATABASE).forEach(([category, clouds]) => {
            clouds.forEach(cloud => {
                allClouds.push({ ...cloud, category });
            });
        });
        return allClouds;
    }

    // 计算总积分
    function calculateTotalScore() {
        let total = 0;
        Object.entries(guideRecords).forEach(([cloudId, record]) => {
            const cloud = findCloudById(cloudId);
            if (cloud && record.count > 0) {
                total += cloud.score * record.count;
            }
        });
        return total;
    }

    // 根据ID找云
    function findCloudById(cloudId) {
        for (const category of Object.values(CLOUD_DATABASE)) {
            const found = category.find(c => c.id === cloudId);
            if (found) return found;
        }
        return null;
    }

    // 渲染图鉴卡牌 - 成就墙风格（按云族分区）
    function renderGuideCards() {
        const guideWall = document.getElementById('guideWall');
        const totalScoreEl = document.getElementById('totalScore');
        const litCountEl = document.getElementById('litCount');
        const totalCardCountEl = document.getElementById('totalCardCount');
        const progressBar = document.getElementById('progressBar');

        // 计算统计数据
        const totalClouds = getAllClouds().length;
        const litClouds = Object.keys(guideRecords).filter(id => guideRecords[id].count > 0).length;
        const totalScore = calculateTotalScore();

        // 更新统计显示
        totalScoreEl.textContent = totalScore;
        litCountEl.textContent = litClouds;
        totalCardCountEl.textContent = totalClouds;
        progressBar.style.width = `${(litClouds / totalClouds) * 100}%`;

        // 按云族分组渲染
        const familyOrder = ['low', 'middle', 'high', 'vertical', 'special'];

        guideWall.innerHTML = familyOrder.map(familyKey => {
            const familyConfig = CLOUD_FAMILY_CONFIG[familyKey];
            const familyClouds = CLOUD_DATABASE[familyKey] || [];

            // 计算该云族的点亮进度
            const familyLitCount = familyClouds.filter(c => guideRecords[c.id]?.count > 0).length;
            const familyTotal = familyClouds.length;
            const familyProgress = familyTotal > 0 ? Math.round((familyLitCount / familyTotal) * 100) : 0;

            // 生成该云族的卡牌
            const cardsHtml = familyClouds.map(cloud => {
                const rarity = getRarityByScore(cloud.score);
                const rarityName = RARITY_CONFIG[rarity].name;
                const record = guideRecords[cloud.id];
                const isLit = record && record.count > 0;
                const litCount = record?.count || 0;

                if (isLit) {
                    // 已点亮：显示完整信息
                    return `
                        <div class="guide-card lit rarity-${rarity}" data-cloud-id="${cloud.id}">
                            <div class="guide-card-icon">
                                <span class="guide-card-rarity rarity-${rarity}">${rarityName}</span>
                                ${litCount > 1 ? `<span class="lit-count-badge">×${litCount}</span>` : ''}
                                ${cloud.icon}
                            </div>
                            <div class="guide-card-info">
                                <div class="guide-card-name">${cloud.name}</div>
                                <div class="guide-card-latin">${cloud.latin}</div>
                                <div class="guide-card-score">
                                    <span class="score-icon">⭐</span>
                                    <span>${cloud.score}分</span>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    // 未点亮：剪影 + 提示
                    const hint = cloud.hint || '🔍 寻找这种神秘的云朵';
                    return `
                        <div class="guide-card unlit" data-cloud-id="${cloud.id}">
                            <div class="guide-card-icon">
                                <span class="cloud-emoji">${cloud.icon}</span>
                                <span class="mystery-mark">?</span>
                            </div>
                            <div class="guide-card-info">
                                <div class="guide-card-name">???</div>
                                <div class="guide-card-hint">${hint}</div>
                                <div class="guide-card-score">
                                    <span class="score-icon">⭐</span>
                                    <span>??分</span>
                                </div>
                            </div>
                        </div>
                    `;
                }
            }).join('');

            // 返回云族分区HTML
            return `
                <div class="guide-family-section" data-family="${familyKey}">
                    <div class="guide-family-header">
                        <div class="guide-family-title">
                            <span class="guide-family-icon">${familyConfig.icon}</span>
                            <span class="guide-family-name">${familyConfig.name}</span>
                            <span class="guide-family-desc">${familyConfig.desc}</span>
                        </div>
                        <div class="guide-family-progress">
                            <span class="guide-family-count">${familyLitCount}/${familyTotal}</span>
                            <div class="guide-family-progress-bar">
                                <div class="guide-family-progress-fill" style="width: ${familyProgress}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="guide-card-grid">
                        ${cardsHtml}
                    </div>
                </div>
            `;
        }).join('');

        // 点击查看详情
        guideWall.querySelectorAll('.guide-card').forEach(card => {
            card.addEventListener('click', () => {
                const cloudId = card.dataset.cloudId;
                const cloud = findCloudById(cloudId);
                if (cloud) {
                    showGuideCardModal(cloud);
                }
            });
        });
    }

    // 显示图鉴卡牌详情弹窗
    function showGuideCardModal(cloud) {
        const rarity = getRarityByScore(cloud.score);
        const rarityName = RARITY_CONFIG[rarity].name;
        const record = guideRecords[cloud.id];
        const isLit = record && record.count > 0;
        const litCount = record?.count || 0;
        const collectionData = collection.find(c => c.cloudId === cloud.id || c.name === cloud.name);

        const modal = document.createElement('div');
        modal.className = 'card-modal-overlay';

        if (isLit) {
            // 已点亮：显示完整信息
            modal.innerHTML = `
                <div class="card-modal">
                    <div class="cloud-card rarity-${rarity}">
                        <button class="card-modal-close">&times;</button>
                        <div class="card-rarity-banner rarity-${rarity}"><span>${rarityName}</span></div>
                        <div class="guide-modal-content">
                            <div class="guide-modal-icon">${cloud.icon}</div>
                            <div class="guide-modal-name">${cloud.name}</div>
                            <div class="guide-modal-latin">${cloud.latin}</div>
                            <div class="guide-modal-stats">
                                <div class="guide-modal-stat">
                                    <div class="guide-modal-stat-value">${cloud.score}</div>
                                    <div class="guide-modal-stat-label">基础分</div>
                                </div>
                                <div class="guide-modal-stat">
                                    <div class="guide-modal-stat-value">${litCount}</div>
                                    <div class="guide-modal-stat-label">点亮次数</div>
                                </div>
                                <div class="guide-modal-stat">
                                    <div class="guide-modal-stat-value">${cloud.score * litCount}</div>
                                    <div class="guide-modal-stat-label">累计积分</div>
                                </div>
                            </div>
                            ${collectionData?.image ? `
                                <div style="margin-bottom: 15px; border-radius: 12px; overflow: hidden;">
                                    <img src="${collectionData.image}" alt="${cloud.name}" style="width: 100%; height: 150px; object-fit: cover;">
                                </div>
                            ` : ''}
                            <div class="guide-modal-desc">${cloud.description}</div>
                            <div class="guide-modal-weather">
                                <span class="guide-modal-weather-icon">🌦️</span>
                                <span>${cloud.weather}</span>
                            </div>
                            ${record?.firstLitAt ? `
                                <div style="margin-top: 12px; font-size: 0.8rem; color: var(--text-soft); text-align: center;">
                                    首次点亮于 ${new Date(record.firstLitAt).toLocaleDateString('zh-CN')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        } else {
            // 未点亮：神秘状态，显示寻找线索
            const rarity = getRarityByScore(cloud.score);
            const rarityColor = RARITY_CONFIG[rarity].color;
            const hint = cloud.hint || '🔍 寻找这种神秘的云朵';
            const whenToFind = cloud.whenToFind || '等待时机';
            const whereToFind = cloud.whereToFind || '抬头仰望天空';

            modal.innerHTML = `
                <div class="card-modal">
                    <div class="cloud-card unlit-modal" style="background: linear-gradient(135deg, #f0f4f8, #e8ecf0); border: 3px dashed ${rarityColor}40;">
                        <button class="card-modal-close">&times;</button>
                        <div class="guide-modal-content">
                            <div class="guide-modal-icon" style="filter: brightness(0) opacity(0.15); font-size: 5rem;">${cloud.icon}</div>
                            <div class="guide-modal-name" style="color: var(--text-muted);">??? 未知云种</div>

                            <div class="hint-card" style="margin-top: 20px; padding: 20px; background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.5)); border-radius: 16px; border: 1px solid ${rarityColor}30;">
                                <div style="font-size: 1rem; font-weight: 600; color: var(--text-main);">
                                    ${hint}
                                </div>
                            </div>

                            <div class="clue-section" style="margin-top: 16px; text-align: left;">
                                <div class="clue-item" style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; padding: 12px; background: rgba(135,206,235,0.1); border-radius: 12px;">
                                    <span style="font-size: 1.2rem;">⏰</span>
                                    <div>
                                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 2px;">何时寻找</div>
                                        <div style="font-size: 0.9rem; color: var(--text-main);">${whenToFind}</div>
                                    </div>
                                </div>
                                <div class="clue-item" style="display: flex; align-items: flex-start; gap: 10px; padding: 12px; background: rgba(168,197,181,0.1); border-radius: 12px;">
                                    <span style="font-size: 1.2rem;">📍</span>
                                    <div>
                                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 2px;">去哪里找</div>
                                        <div style="font-size: 0.9rem; color: var(--text-main);">${whereToFind}</div>
                                    </div>
                                </div>
                            </div>

                            <div style="margin-top: 16px; padding: 12px; background: rgba(0,0,0,0.03); border-radius: 12px; text-align: center;">
                                <span style="font-size: 0.8rem; color: var(--text-soft);">
                                    ${cloud.family} · 基础分 ${cloud.score} · ${RARITY_CONFIG[rarity].name}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        document.body.appendChild(modal);

        // 关闭弹窗
        modal.querySelector('.card-modal-close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    // 设置加载状态
    function setLoading(loading) {
        const btnText = recognizeBtn.querySelector('.btn-text');
        const btnLoading = recognizeBtn.querySelector('.btn-loading');

        if (loading) {
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline';
            recognizeBtn.disabled = true;
        } else {
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            recognizeBtn.disabled = false;
        }
    }

    // 初始化图鉴展示
    renderGuideCards();

    // 更新显示结果中的收集按钮状态
    function updateCollectButtonStatus(cloudName) {
        const cloudId = findCloudIdByName(cloudName);
        const record = guideRecords[cloudId];
        const collectBtn = document.getElementById('collectBtn');

        if (record && record.count > 0) {
            collectBtn.innerHTML = `<span>再次点亮 (已×${record.count})</span>`;
            collectBtn.classList.remove('collected');
            collectBtn.disabled = false;
        } else {
            collectBtn.innerHTML = '<span>点亮图鉴</span>';
            collectBtn.classList.remove('collected');
            collectBtn.disabled = false;
        }
    }
});

console.log('☁️ 云朵收集器已加载 - 收集属于你的云彩卡牌');

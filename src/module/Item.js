/* 物品模块 */
'use strict';
import Info from './Info';
import * as Util from './Util';
import * as Msg from './Msg';
import * as Dialog from './Dialog';
import Const from './Const';
import {read as readConfig, write as writeConfig} from './Config';
import * as Log from './Log';
import * as Script from './Script';
import * as Public from './Public';

// 盒子区域
let $boxArea;
// 装备区域
let $armArea;
// 物品区域
let $itemArea;
// SafeID
let safeId;

// 盒子种类列表
export const boxTypeList = ['普通盒子', '幸运盒子', '稀有盒子', '传奇盒子', '神秘盒子'];

// 装备组别列表
export const armGroupList = ['长剑', '短弓', '法杖'];
// 装备种类列表
export const armTypeList = ['普通的装备', '幸运的装备', '稀有的装备', '传奇的装备', '神秘的装备'];

// 道具种类列表
export const itemTypeList = [
    '零时迷子的碎片', '被遗弃的告白信', '学校天台的钥匙', 'TMA最新作压缩包', 'LOLI的钱包', '棒棒糖', '蕾米莉亚同人漫画', '十六夜同人漫画',
    '档案室钥匙', '傲娇LOLI娇蛮音CD', '整形优惠卷', '消逝之药',
];

/**
 * 初始化
 */
export const init = function () {
    safeId = Public.getSafeId();
    if (!safeId) return;
    $boxArea = $('.kf_fw_ig1:eq(0)');
    $armArea = $('.kf_fw_ig4:eq(0)');
    $itemArea = $('.kf_fw_ig1:eq(1)');
    addBatchOpenBoxesLink();
    addOpenAllBoxesButton();
    addBatchSmeltArmsButton();
    addBatchUseAndSellItemsButton();
};

/**
 * 获取指定名称的道具等级
 * @param {string} itemName 道具名称
 * @returns {number} 道具等级
 */
export const getLevelByName = function (itemName) {
    switch (itemName) {
        case '零时迷子的碎片':
        case '被遗弃的告白信':
        case '学校天台的钥匙':
        case 'TMA最新作压缩包':
            return 1;
        case 'LOLI的钱包':
        case '棒棒糖':
            return 2;
        case '蕾米莉亚同人漫画':
        case '十六夜同人漫画':
            return 3;
        case '档案室钥匙':
        case '傲娇LOLI娇蛮音CD':
            return 4;
        case '整形优惠卷':
        case '消逝之药':
            return 5;
        default:
            return 0;
    }
};

/**
 * 获取道具使用情况
 * @param html 争夺首页的HTML代码
 * @returns {Map} 道具使用情况列表
 */
export const getItemUsedInfo = function (html) {
    let itemUsedNumList = new Map([
        ['蕾米莉亚同人漫画', 0],
        ['十六夜同人漫画', 0],
        ['档案室钥匙', 0],
        ['傲娇LOLI娇蛮音CD', 0],
        ['消逝之药', 0],
        ['整形优惠卷', 0],
    ]);
    let matches = html.match(/value="\[\s*(\d+)\s*](\S+?)"/g);
    for (let i in matches) {
        let subMatches = /value="\[\s*(\d+)\s*](\S+?)"/.exec(matches[i]);
        itemUsedNumList.set(subMatches[2], parseInt(subMatches[1]));
    }
    return itemUsedNumList;
};

/**
 * 在物品装备页面上添加批量使用和出售道具按钮
 */
const addBatchUseAndSellItemsButton = function () {
    $(`
<div class="pd_item_btns" data-name="handleItemsBtns">
  <button name="useItems" type="button" style="color: #00f;" title="批量使用指定道具">批量使用</button>
  <button name="sellItems" type="button" style="color: #f00;" title="批量出售指定道具">批量出售</button>
</div>
`).insertAfter($itemArea).find('[name="useItems"]').click(() => showBatchUseAndSellItemsDialog(1, safeId))
        .end().find('[name="sellItems"]').click(() => showBatchUseAndSellItemsDialog(2, safeId));

    Public.addSlowActionChecked($('.pd_item_btns[data-name="handleItemsBtns"]'));
};

/**
 * 显示批量使用和出售道具对话框
 * @param {number} type 对话框类型，1：批量使用；2：批量出售
 * @param {string} safeId SafeID
 */
const showBatchUseAndSellItemsDialog = function (type, safeId) {
    const dialogName = 'pdBatchUseAndSellItemsDialog';
    if ($('#' + dialogName).length > 0) return;
    Msg.destroy();
    let typeName = type === 1 ? '使用' : '出售';
    readConfig();

    let html = `
<div class="pd_cfg_main">
  <div style="margin: 5px 0;">请选择想批量${typeName}的道具种类（按<b>Ctrl键</b>或<b>Shift键</b>可多选）：</div>
  <select name="itemTypes" size="6" style="width: 320px;" multiple>
    <option>蕾米莉亚同人漫画</option><option>十六夜同人漫画</option><option>档案室钥匙</option>
    <option>傲娇LOLI娇蛮音CD</option><option>整形优惠卷</option><option>消逝之药</option>
  </select>
</div>
<div class="pd_cfg_btns">
  <button name="sell" type="button">${typeName}</button>
  <button data-action="close" type="button">关闭</button>
</div>`;
    let $dialog = Dialog.create(dialogName, `批量${typeName}道具`, html);

    $dialog.find('[name="itemTypes"]').keydown(function (e) {
        if (e.ctrlKey && e.keyCode === 65) {
            e.preventDefault();
            $(this).children().prop('selected', true);
        }
    }).end().find('[name="sell"]').click(function () {
        let typeList = $dialog.find('[name="itemTypes"]').val();
        if (!Array.isArray(typeList)) return;
        readConfig();
        if (type === 1) Config.defUseItemTypeList = typeList;
        else Config.defSellItemTypeList = typeList;
        writeConfig();
        if (!confirm(`是否${typeName}所选道具种类？`)) return;
        Dialog.close(dialogName);
        if (type === 1) useItems(typeList, safeId);
        else sellItems(typeList, safeId);
    });

    $dialog.find('[name="itemTypes"] > option').each(function () {
        let $this = $(this);
        let itemTypeList = type === 1 ? Config.defUseItemTypeList : Config.defSellItemTypeList;
        if (itemTypeList.includes($this.val())) $this.prop('selected', true);
    });

    Dialog.show(dialogName);
    Script.runFunc('Item.showBatchUseAndSellItemsDialog_after_', type);
};

/**
 * 使用道具
 * @param {string[]} typeList 想要使用的道具种类
 * @param {string} safeId SafeID
 */
const useItems = function (typeList, safeId) {
    let totalSuccessNum = 0, index = 0;
    let useInfo = {};
    let tmpItemTypeList = [...typeList];

    /**
     * 使用
     * @param {number} itemId 道具ID
     * @param {string} itemName 道具名称
     * @param {number} itemNum 本轮使用的道具数量
     */
    const use = function (itemId, itemName, itemNum) {
        index++;
        $.ajax({
            type: 'POST',
            url: 'kf_fw_ig_mybpdt.php',
            data: `do=1&id=${itemId}&safeid=${safeId}`,
            timeout: Const.defAjaxTimeout,
        }).done(function (html) {
            if (!html) return;
            let msg = Util.removeHtmlTag(html);
            let isDelete = false;
            if (/(成功|失败)！/.test(msg)) {
                totalSuccessNum++;
                if (!(itemName in useInfo)) useInfo[itemName] = {'道具': 0, '有效道具': 0, '无效道具': 0};
                useInfo[itemName]['道具']++;
                if (/成功！/.test(msg)) useInfo[itemName]['有效道具']++;
                else useInfo[itemName]['无效道具']++;
                $wait.find('.pd_countdown').text(totalSuccessNum);
                isDelete = true;
            }
            else if (/无法再使用/.test(msg)) {
                index = itemNum;
                let typeIndex = tmpItemTypeList.indexOf(itemName);
                if (typeIndex > -1) tmpItemTypeList.splice(typeIndex, 1);
            }
            else {
                isDelete = true;
            }

            if (isDelete) {
                $itemArea.find(`[id="wp_${itemId}"]`).fadeOut('normal', function () {
                    $(this).remove();
                });
            }
            console.log(`【Lv.${getLevelByName(itemName)}：${itemName}】 ${msg}`);
            $('.pd_result[data-name="itemResult"]:last').append(`<li>【Lv.${getLevelByName(itemName)}：${itemName}】 ${msg}</li>`);
            Script.runFunc('Item.useItems_after_');
        }).fail(function () {
            $('.pd_result[data-name="itemResult"]:last').append(
                `<li>【Lv.${getLevelByName(itemName)}：${itemName}】 <span class="pd_notice">连接超时</span></li>`
            );
        }).always(function () {
            if ($wait.data('stop')) complete();
            else {
                if (index === itemNum) setTimeout(
                    getNextItems,
                    typeof Const.specialAjaxInterval === 'function' ? Const.specialAjaxInterval() : Const.specialAjaxInterval
                );
                else setTimeout(
                    () => $(document).dequeue('UseItems'),
                    typeof Const.specialAjaxInterval === 'function' ? Const.specialAjaxInterval() : Const.specialAjaxInterval
                );
            }
        });
    };

    /**
     * 获取当前的道具
     */
    const getCurrentItems = function () {
        let itemList = [];
        $itemArea.find('tr[id^="wp_"]').each(function () {
            let $this = $(this);
            let matches = /wp_(\d+)/.exec($this.attr('id'));
            if (!matches) return;
            let itemId = parseInt(matches[1]);
            let itemName = $this.find('> td:nth-child(3)').text().trim();
            if (tmpItemTypeList.includes(itemName)) itemList.push({itemId, itemName});
        });
        if (!itemList.length) {
            complete();
            return;
        }

        index = 0;
        $(document).clearQueue('UseItems');
        $.each(itemList, function (i, {itemId, itemName}) {
            $(document).queue('UseItems', () => use(itemId, itemName, itemList.length));
        });
        $(document).dequeue('UseItems');
    };

    /**
     * 获取下一批道具
     */
    const getNextItems = function () {
        getNextObjects(2, () => {
            if ($wait.data('stop')) complete();
            else setTimeout(getCurrentItems, Const.defAjaxInterval);
        });
    };

    /**
     * 操作完成
     */
    const complete = function () {
        $(document).clearQueue('UseItems');
        Msg.remove($wait);
        if ($.isEmptyObject(useInfo)) {
            alert('没有道具被使用！');
            return;
        }

        let itemTypeNum = 0;
        let resultStat = '';
        for (let itemName of Util.getSortedObjectKeyList(typeList, useInfo)) {
            itemTypeNum++;
            let itemLevel = getLevelByName(itemName);
            let stat = useInfo[itemName];
            let successNum = stat['道具'];
            delete stat['道具'];
            if (stat['有效道具'] === 0) delete stat['有效道具'];
            if (stat['无效道具'] === 0) delete stat['无效道具'];
            if (!$.isEmptyObject(stat)) {
                resultStat += `【Lv.${itemLevel}：${itemName}】 <i>道具<ins>-${successNum}</ins></i> `;
                for (let [key, num] of Util.entries(stat)) {
                    resultStat += `<i>${key}<em>+${num}</em></i> `;
                }
                resultStat += '<br>';
                Log.push(
                    '使用道具',
                    `共有\`${successNum}\`个【\`Lv.${itemLevel}：${itemName}\`】道具被使用`,
                    {gain: stat, pay: {'道具': -successNum}}
                );
            }
        }
        $('.pd_result[data-name="itemResult"]:last').append(`
<li class="pd_stat">
  <b>统计结果（共有<em>${itemTypeNum}</em>个种类中的<em>${totalSuccessNum}</em>个道具被使用）：</b><br>
  ${resultStat}
</li>`);
        console.log(`共有${itemTypeNum}个种类中的${totalSuccessNum}个道具被使用`);
        Msg.show(`<strong>共有<em>${itemTypeNum}</em>个种类中的<em>${totalSuccessNum}</em>个道具被使用</strong>`, -1);
        setTimeout(() => getNextObjects(2), Const.defAjaxInterval);
        Script.runFunc('Item.useItems_complete_');
    };

    $itemArea.parent().append('<ul class="pd_result" data-name="itemResult"><li><strong>使用结果：</strong></li></ul>');
    let $wait = Msg.wait(
        '<strong>正在使用道具中&hellip;</strong><i>已使用：<em class="pd_countdown">0</em></i><a class="pd_stop_action" href="#">停止操作</a>'
    );
    getCurrentItems();
};

/**
 * 出售道具
 * @param {string[]} itemTypeList 想要出售的道具种类
 * @param {string} safeId SafeID
 */
const sellItems = function (itemTypeList, safeId) {
    let successNum = 0, index = 0;
    let sellInfo = {};

    /**
     * 出售
     * @param {number} itemId 道具ID
     * @param {string} itemName 道具名称
     * @param {number} itemNum 本轮出售的道具数量
     */
    const sell = function (itemId, itemName, itemNum) {
        index++;
        $.ajax({
            type: 'POST',
            url: 'kf_fw_ig_mybpdt.php',
            data: `do=2&id=${itemId}&safeid=${safeId}`,
            timeout: Const.defAjaxTimeout,
        }).done(function (html) {
            if (!html) return;
            let msg = Util.removeHtmlTag(html);
            console.log(`【Lv.${getLevelByName(itemName)}：${itemName}】 ${msg}`);
            $('.pd_result[data-name="itemResult"]:last').append(`<li>【Lv.${getLevelByName(itemName)}：${itemName}】 ${msg}</li>`);
            $itemArea.find(`[id="wp_${itemId}"]`).fadeOut('normal', function () {
                $(this).remove();
            });

            let matches = /出售该物品获得了\[\s*(\d+)\s*]KFB/.exec(msg);
            if (!matches) return;
            successNum++;
            if (!(itemName in sellInfo)) sellInfo[itemName] = {num: 0, sell: 0};
            sellInfo[itemName].num++;
            sellInfo[itemName].sell += parseInt(matches[1]);
            $wait.find('.pd_countdown').text(successNum);
            Script.runFunc('Item.sellItems_after_');
        }).fail(function () {
            $('.pd_result[data-name="itemResult"]:last').append(
                `<li>【Lv.${getLevelByName(itemName)}：${itemName}】 <span class="pd_notice">连接超时</span></li>`
            );
        }).always(function () {
            if ($wait.data('stop')) {
                complete();
            }
            else {
                if (index === itemNum) setTimeout(getNextItems, Const.minItemActionInterval);
                else setTimeout(() => $(document).dequeue('SellItems'), Const.minItemActionInterval);
            }
        });
    };

    /**
     * 获取当前的道具
     */
    const getCurrentItems = function () {
        let itemList = [];
        $itemArea.find('tr[id^="wp_"]').each(function () {
            let $this = $(this);
            let matches = /wp_(\d+)/.exec($this.attr('id'));
            if (!matches) return;
            let itemId = parseInt(matches[1]);
            let itemName = $this.find('> td:nth-child(3)').text().trim();
            if (itemTypeList.includes(itemName)) itemList.push({itemId, itemName});
        });
        if (!itemList.length) {
            complete();
            return;
        }

        index = 0;
        $(document).clearQueue('SellItems');
        $.each(itemList, function (i, {itemId, itemName}) {
            $(document).queue('SellItems', () => sell(itemId, itemName, itemList.length));
        });
        $(document).dequeue('SellItems');
    };

    /**
     * 获取下一批道具
     */
    const getNextItems = function () {
        getNextObjects(2, () => {
            if ($wait.data('stop')) complete();
            else setTimeout(getCurrentItems, Const.defAjaxInterval);
        });
    };

    /**
     * 操作完成
     */
    const complete = function () {
        $(document).clearQueue('SellItems');
        Msg.remove($wait);
        if ($.isEmptyObject(sellInfo)) {
            alert('没有道具被出售！');
            return;
        }

        let itemTypeNum = 0, totalSell = 0;
        let resultStat = '';
        for (let itemName of Util.getSortedObjectKeyList(itemTypeList, sellInfo)) {
            itemTypeNum++;
            let itemLevel = getLevelByName(itemName);
            let {sell, num} = sellInfo[itemName];
            totalSell += sell;
            resultStat += `【Lv.${itemLevel}：${itemName}】 <i>道具<ins>-${num}</ins></i> <i>KFB<em>+${sell.toLocaleString()}</em></i><br>`;
            Log.push(
                '出售道具',
                `共有\`${num}\`个【\`Lv.${itemLevel}：${itemName}\`】道具出售成功`,
                {gain: {'KFB': sell}, pay: {'道具': -num}}
            );
        }
        $('.pd_result[data-name="itemResult"]:last').append(`
<li class="pd_stat">
  <b>统计结果（共有<em>${itemTypeNum}</em>个种类中的<em>${successNum}</em>个道具出售成功）：</b> <i>KFB<em>+${totalSell.toLocaleString()}</em></i><br>
  ${resultStat}
</li>`);
        console.log(`共有${itemTypeNum}个种类中的${successNum}个道具出售成功，KFB+${totalSell}`);
        Msg.show(
            `<strong>共有<em>${itemTypeNum}</em>个种类中的<em>${successNum}</em>个道具出售成功</strong><i>KFB<em>+${totalSell.toLocaleString()}</em></i>`, -1
        );
        setTimeout(() => getNextObjects(2), Const.defAjaxInterval);
        Script.runFunc('Item.sellItems_complete_');
    };

    $itemArea.parent().append(`<ul class="pd_result" data-name="itemResult"><li><strong>出售结果：</strong></li></ul>`);
    let $wait = Msg.wait(
        '<strong>正在出售道具中&hellip;</strong><i>已出售：<em class="pd_countdown">0</em></i><a class="pd_stop_action" href="#">停止操作</a>'
    );
    getCurrentItems();
};

/**
 * 获取下一批物品
 * @param {number} sequence 下一批物品的插入顺序，1：向前插入；2：往后添加
 * @param {function} callback 回调函数
 */
export const getNextObjects = function (sequence, callback = null) {
    console.log('获取下一批物品Start');
    $.ajax({
        type: 'GET',
        url: 'kf_fw_ig_mybp.php?t=' + $.now(),
        timeout: Const.defAjaxTimeout,
    }).done(function (html) {
        for (let i = 1; i <= 2; i++) {
            let matches = null;
            if (i === 1) {
                matches = /<tr><td width="\d+%">装备.+?\r\n(<tr id="wp_\d+"><td>.+?<\/tr>)<tr><td colspan="4">/.exec(html);
            }
            else {
                matches = /<tr><td width="\d+%">使用.+?\r\n(<tr id="wp_\d+"><td>.+?<\/tr>)<tr><td colspan="4">/.exec(html);
            }
            if (!matches) continue;
            let trMatches = matches[1].match(/<tr id="wp_\d+">(.+?)<\/tr>/g);
            let $area = i === 1 ? $armArea : $itemArea;
            let addHtml = '';
            for (let i in trMatches) {
                let idMatches = /"wp_(\d+)"/.exec(trMatches[i]);
                if (!idMatches) continue;
                if (!$area.has(`tr[id="wp_${idMatches[1]}"]`).length) {
                    addHtml += trMatches[i];
                }
            }
            if (addHtml) {
                if (sequence === 2) {
                    $area.find('> tbody > tr:last-child').before(addHtml);
                }
                else {
                    $area.find('> tbody > tr:nth-child(2)').after(addHtml);
                }
            }
        }
        if (typeof callback === 'function') callback();
    }).fail(function () {
        setTimeout(() => getNextObjects(sequence, callback), Const.defAjaxInterval);
    });
};

/**
 * 添加批量购买道具链接
 */
export const addBatchBuyItemsLink = function () {
    let $area = $('.kf_fw_ig1').addClass('pd_items');
    $area.find('> tbody > tr:first-child > td:nth-child(2)').css('width', '430px')
        .next('td').next('td').css('width', '120px');
    $area.find('a[href^="kf_fw_ig_shop.php?do=buy&id="]').after('<a data-name="batchBuyItem" href="#">批量购买</a>');
    $area.on('click', '[data-name="batchBuyItem"]', function (e) {
        e.preventDefault();
        let $this = $(this);
        let $line = $this.closest('tr');
        let type = $line.find('td:first-child').text().trim();
        let kfb = parseInt($line.find('td:nth-child(3)').text());
        let url = $this.prev('a').attr('href');
        if (!type.includes('道具') || !kfb || !url) return;
        let num = parseInt(prompt(`你要购买多少个【${type}】？（单价：${kfb.toLocaleString()} KFB）`, 0));
        if (!num || num < 0) return;

        Msg.wait(
            `<strong>正在购买道具中&hellip;</strong><i>剩余：<em class="pd_countdown">${num}</em></i><a class="pd_stop_action" href="#">停止操作</a>`
        );
        buyItems(num, type, kfb, url);
    }).on('click', 'a[href^="kf_fw_ig_shop.php?do=buy&id="]', () => confirm('是否购买该物品？'));
    $area.after('<div class="pd_item_btns"></div>');
    Public.addSlowActionChecked($('.pd_item_btns'));
    showKfbInItemShop();
};

/**
 * 购买道具
 * @param {number} buyNum 购买数量
 * @param {string} type 购买项目
 * @param {number} kfb 道具单价
 * @param {string} url 购买URL
 */
const buyItems = function (buyNum, type, kfb, url) {
    let successNum = 0, totalKfb = 0;
    let myItemUrlList = [];
    let itemList = {};
    let isStop = false;

    /**
     * 购买
     */
    const buy = function () {
        $.ajax({
            type: 'GET',
            url: url + '&t=' + new Date().getTime(),
            timeout: Const.defAjaxTimeout,
            success(html) {
                Public.showFormatLog('购买道具', html);
                let {msg} = Util.getResponseMsg(html);
                if (/购买成功，返回我的背包/.test(msg)) {
                    successNum++;
                    totalKfb += kfb;
                }
                else {
                    isStop = true;
                    $('.pd_result:last').append(`<li>${msg}<span class="pd_notice">（购买中止）</span></li>`);
                }
                setTimeout(getNewItemInfo, Const.defAjaxInterval);
            },
            error() {
                setTimeout(buy, Const.defAjaxInterval);
            }
        });
    };

    /**
     * 获取新道具的信息
     * @param {boolean} isFirst 购买前第一次获取信息
     */
    const getNewItemInfo = function (isFirst = false) {
        $.ajax({
            type: 'GET',
            url: 'kf_fw_ig_mybp.php?t=' + new Date().getTime(),
            timeout: Const.defAjaxTimeout,
            success(html) {
                let list = [];
                $('.kf_fw_ig1 a[href^="kf_fw_ig_mybp.php?do=1&id="]', html).each(function () {
                    let $this = $(this);
                    let url = $this.attr('href');
                    list.push(url);
                    if (isFirst || myItemUrlList.includes(url)) return;
                    let itemName = $this.closest('tr').find('td:nth-child(2)').text().trim();
                    if (!itemTypeList.includes(itemName)) return;
                    if (!(itemName in itemList)) itemList[itemName] = 0;
                    itemList[itemName]++;
                    console.log(`获得了一个【Lv.${getLevelByName(itemName)}：${itemName}】道具`);
                    $('.pd_result:last').append(
                        `<li>获得了一个【<b class="pd_highlight">Lv.${getLevelByName(itemName)}：${itemName}</b>】道具</li>`
                    );
                });
                myItemUrlList = list;

                let $countdown = $('.pd_countdown:last');
                $countdown.text(buyNum - successNum);
                isStop = isStop || $countdown.closest('.pd_msg').data('stop');
                if (isStop || successNum === buyNum) {
                    Msg.remove($countdown.closest('.pd_msg'));
                    for (let [itemName, num] of Util.entries(itemList)) {
                        if (!num) delete itemList[itemName];
                    }
                    if (successNum > 0 && !$.isEmptyObject(itemList)) {
                        Log.push(
                            '购买道具',
                            `共有\`${successNum}\`个【\`${type}\`】购买成功`,
                            {gain: {'道具': successNum, 'item': itemList}, pay: {'KFB': -totalKfb}}
                        );
                    }

                    let itemStatHtml = '';
                    for (let itemName of Util.getSortedObjectKeyList(itemTypeList, itemList)) {
                        itemStatHtml += `<i>${itemName}<em>+${itemList[itemName]}</em></i> `;
                    }
                    $('.pd_result:last').append(`
<li class="pd_stat">
  <b>统计结果：</b><br>
  共有<em>${successNum}</em>个道具购买成功，<i>KFB<ins>-${totalKfb.toLocaleString()}</ins></i> ${itemStatHtml}<br>
  <span style="color: #666;">(请到<a href="kf_fw_ig_mybp.php">角色/物品页面</a>查看)</span>
</li>
`);

                    console.log(`共有${successNum}个【${type}】购买成功，KFB-${totalKfb}`);
                    Msg.show(`<strong>共有<em>${successNum}</em>个【${type}】购买成功</strong><i>KFB<ins>-${totalKfb.toLocaleString()}</ins></i>`, -1);
                    showKfbInItemShop();
                }
                else {
                    let interval = typeof Const.specialAjaxInterval === 'function' ? Const.specialAjaxInterval() : Const.specialAjaxInterval;
                    setTimeout(buy, isFirst ? Const.defAjaxInterval : interval);
                }
            },
            error() {
                setTimeout(() => getNewItemInfo(isFirst), Const.defAjaxInterval);
            }
        });
    };

    $('.kf_fw_ig1:last').parent().append(`<ul class="pd_result"><li><strong>【${type}】购买结果：</strong></li></ul>`);
    getNewItemInfo(true);
};

/**
 * 在道具商店显示当前持有的KFB
 */
const showKfbInItemShop = function () {
    $.get(`profile.php?action=show&uid=${Info.uid}&t=${new Date().getTime()}`, function (html) {
        let matches = /论坛货币：(\d+)\s*KFB<br/i.exec(html);
        if (!matches) return;
        let cash = parseInt(matches[1]);
        $('.kf_fw_ig_title1:last').find('span:last').remove()
            .end().append(`<span style="margin-left: 7px;">(当前持有 <b style="font-size: 14px;">${cash.toLocaleString()}</b> KFB)</span>`);
    });
};

/**
 * 添加批量打开盒子链接
 */
const addBatchOpenBoxesLink = function () {
    $boxArea = $('.kf_fw_ig1:first');
    $boxArea.find('> tbody > tr:nth-child(3) > td > a[onclick^="dkhz"]').each(function () {
        let $this = $(this);
        let matches = /dkhz\('(\d+)'\)/.exec($this.attr('onclick'));
        if (!matches) return;
        $this.after(`<a class="pd_highlight" href="#" data-name="openBoxes" data-id="${matches[1]}" style="margin-left: 10px;">批量打开</a>`);
    });

    $boxArea.on('click', 'a[data-name="openBoxes"]', function (e) {
        e.preventDefault();
        let $this = $(this);
        let id = parseInt($this.data('id'));
        let $info = $boxArea.find(`> tbody > tr:nth-child(2) > td:nth-child(${id})`);
        let boxType = $info.find('span:first').text().trim() + '盒子';
        if (!boxTypeList.includes(boxType)) return;
        let currentNum = parseInt($info.find('span:last').text());
        let num = parseInt(prompt(`你要打开多少个【${boxType}】？`, currentNum));
        if (!num || num < 0) return;
        Msg.destroy();
        openBoxes({id, boxType, num, safeId});
    });
};

/**
 * 添加打开全部盒子按钮
 */
const addOpenAllBoxesButton = function () {
    $(`
<div class="pd_item_btns" data-name="openBoxesBtns">
  <button name="openAllBoxes" type="button" style="color: #f00;" title="打开全部盒子">一键开盒</button>
</div>
`).insertAfter($boxArea).find('[name="openAllBoxes"]').click(function () {
        if (!confirm('是否打开全部盒子？')) return;
        Msg.destroy();
        $(document).clearQueue('OpenAllBoxes');
        $boxArea.find('> tbody > tr:nth-child(2) > td').each(function (index) {
            let $this = $(this);
            let boxType = $this.find('span:first').text().trim() + '盒子';
            if (!boxTypeList.includes(boxType)) return;
            let num = parseInt($this.find('span:last').text());
            if (!num || num < 0) return;
            let id = parseInt($boxArea.find(`> tbody > tr:nth-child(3) > td:nth-child(${index + 1}) > a[data-name="openBoxes"]`).data('id'));
            if (!id) return;
            $(document).queue('OpenAllBoxes', () => openBoxes({id, boxType, num, safeId}));
        });
        $(document).dequeue('OpenAllBoxes');
    });

    Public.addSlowActionChecked($('.pd_item_btns[data-name="openBoxesBtns"]'));
};

/**
 * 打开盒子
 * @param {number} id 盒子类型ID
 * @param {string} boxType 盒子类型名称
 * @param {number} num 打开盒子数量
 * @param {string} safeId SafeID
 */
const openBoxes = function ({id, boxType, num, safeId}) {
    let successNum = 0, failNum = 0, index = 0;
    let randomTotalNum = 0, randomTotalCount = 0;
    let isStop = false;
    let stat = {'KFB': 0, '经验值': 0, '道具': 0, '装备': 0, item: {}, arm: {}};
    $boxArea.parent().append(`<ul class="pd_result" data-name="boxResult"><li><strong>【${boxType}】打开结果：</strong></li></ul>`);
    let $wait = Msg.wait(
        `<strong>正在打开盒子中&hellip;</strong><i>剩余：<em class="pd_countdown">${num}</em></i><a class="pd_stop_action" href="#">停止操作</a>`
    );

    /**
     * 打开
     */
    const open = function () {
        $.ajax({
            type: 'POST',
            url: 'kf_fw_ig_mybpdt.php',
            data: `do=3&id=${id}&safeid=${safeId}`,
            timeout: Const.defAjaxTimeout,
        }).done(function (html) {
            index++;
            let msg = Util.removeHtmlTag(html);
            if (msg.includes('获得')) {
                successNum++;
                let matches = /获得\[(\d+)]KFB/.exec(msg);
                if (matches) stat['KFB'] += parseInt(matches[1]);

                matches = /获得\[(\d+)]经验值/.exec(msg);
                if (matches) stat['经验值'] += parseInt(matches[1]);

                matches = /打开盒子获得了道具\[\s*(.+?)\s*]/.exec(msg);
                if (matches) {
                    stat['道具']++;
                    let itemName = matches[1];
                    if (!(itemName in stat.item)) stat.item[itemName] = 0;
                    stat.item[itemName]++;
                }

                matches = /获得一件\[(.+?)]的?装备/.exec(msg);
                if (matches) {
                    stat['装备']++;
                    let armType = matches[1] + '装备';
                    if (!(armType in stat.arm)) stat.arm[armType] = 0;
                    stat.arm[armType]++;
                }

                matches = /随机值(\d+)/.exec(msg);
                if (matches) {
                    randomTotalCount++;
                    randomTotalNum += parseInt(matches[1]);
                }
            }
            else if (msg.includes('操作过快')) {
                $(document).queue('OpenBoxes', open);
            }
            else if (msg.includes('盒子不足')) {
                $(document).clearQueue('OpenBoxes');
                isStop = true;
            }
            else {
                failNum++;
            }

            console.log(`第${index}次：${msg}`);
            $('.pd_result[data-name="boxResult"]:last').append(`<li><b>第${index}次：</b>${msg}</li>`);
        }).fail(function () {
            failNum++;
        }).always(function () {
            let length = $(document).queue('OpenBoxes').length;
            let $countdown = $('.pd_countdown:last');
            $countdown.text(length);
            let isPause = $countdown.closest('.pd_msg').data('stop');
            isStop = isStop || isPause;
            if (isPause) $(document).clearQueue('OpenAllBoxes');

            if (isStop || !length) {
                Msg.remove($wait);
                let avgRandomNum = randomTotalCount > 0 ? Util.getFixedNumLocStr(randomTotalNum / randomTotalCount, 2) : 0;
                for (let [key, value] of Util.entries(stat)) {
                    if (!value || ($.type(value) === 'object' && $.isEmptyObject(value))) {
                        delete stat[key];
                    }
                }
                if (!$.isEmptyObject(stat)) {
                    Log.push(
                        '打开盒子',
                        `共有\`${successNum}\`个【\`${boxType}\`】打开成功 (平均随机值【\`${avgRandomNum}\`】)`,
                        {
                            gain: stat,
                            pay: {'盒子': -successNum}
                        }
                    );
                }

                let $currentNum = $boxArea.find(`> tbody > tr:nth-child(2) > td:nth-child(${id}) > span:last`);
                let prevNum = parseInt($currentNum.text());
                if (prevNum > 0) {
                    $currentNum.text(prevNum - successNum);
                }

                let resultStatHtml = '', msgStatHtml = '';
                for (let [key, value] of Util.entries(stat)) {
                    let tmpHtml = '';
                    if ($.type(value) === 'object') {
                        resultStatHtml += resultStatHtml ? '<br>' : '';
                        msgStatHtml += msgStatHtml ? '<br>' : '';
                        resultStatHtml += `${key === 'item' ? '道具' : '装备'}：`;

                        let typeList = key === 'item' ? itemTypeList : armTypeList;
                        for (let name of Util.getSortedObjectKeyList(typeList, value)) {
                            tmpHtml += `<i>${name}<em>+${value[name].toLocaleString()}</em></i> `;
                        }
                    }
                    else {
                        tmpHtml += `<i>${key}<em>+${value.toLocaleString()}</em></i> `;
                    }
                    resultStatHtml += tmpHtml;
                    msgStatHtml += tmpHtml.trim();
                }
                if (msgStatHtml.length < 200) {
                    msgStatHtml = msgStatHtml.replace(/(.*)<br>/, '$1');
                }
                $('.pd_result[data-name="boxResult"]:last').append(`
<li class="pd_stat">
  <b>统计结果（平均随机值【<em>${avgRandomNum}</em>】）：</b><br>
  ${resultStatHtml ? resultStatHtml : '无'}
</li>
`);
                console.log(
                    `共有${successNum}个【${boxType}】打开成功（平均随机值【${avgRandomNum}】）${failNum > 0 ? `，共有${failNum}个盒子打开失败` : ''}`
                );
                Msg.show(
                    `<strong>共有<em>${successNum}</em>个【${boxType}】打开成功（平均随机值【<em>${avgRandomNum}</em>】）` +
                    `${failNum > 0 ? `，共有<em>${failNum}</em>个盒子打开失败` : ''}</strong>${msgStatHtml.length > 25 ? '<br>' + msgStatHtml : msgStatHtml}`,
                    -1
                );

                Script.runFunc('Item.openBoxes_after_', stat);
                setTimeout(() => getNextObjects(1), Const.defAjaxInterval);
                setTimeout(
                    () => $(document).dequeue('OpenAllBoxes'),
                    typeof Const.specialAjaxInterval === 'function' ? Const.specialAjaxInterval() : Const.specialAjaxInterval
                );
            }
            else {
                if (index % 10 === 0) {
                    setTimeout(() => getNextObjects(1), Const.defAjaxInterval);
                }
                setTimeout(
                    () => $(document).dequeue('OpenBoxes'),
                    typeof Const.specialAjaxInterval === 'function' ? Const.specialAjaxInterval() : Const.specialAjaxInterval
                );
            }
        });
    };

    $(document).clearQueue('OpenBoxes');
    $.each(new Array(num), function () {
        $(document).queue('OpenBoxes', open);
    });
    $(document).dequeue('OpenBoxes');
};

/**
 * 在物品装备页面上添加批量熔炼装备按钮
 */
const addBatchSmeltArmsButton = function () {
    $(`
<div class="pd_item_btns" data-name="handleArmBtns">
  <button name="smeltArms" type="button" style="color: #f00;" title="批量熔炼指定装备">批量熔炼</button>
</div>
`).insertAfter($armArea).find('[name="smeltArms"]').click(() => showBatchSmeltArmsDialog(safeId));
};

/**
 * 显示批量熔炼装备对话框
 * @param {string} safeId SafeID
 */
const showBatchSmeltArmsDialog = function (safeId) {
    const dialogName = 'pdBatchSmeltArmsDialog';
    if ($('#' + dialogName).length > 0) return;
    Msg.destroy();
    readConfig();

    let armCheckedHtml = '';
    for (let group of armGroupList) {
        armCheckedHtml += `<li><b>${group}：</b>`;
        for (let type of armTypeList) {
            let prefix = type.split('的')[0];
            if (prefix === '神秘') continue;
            let name = `${prefix}的${group}`;
            armCheckedHtml += `
<label style="margin-right: 5px;">
  <input type="checkbox" name="smeltArmsType" value="${name}" ${Config.defSmeltArmTypeList.includes(name) ? 'checked' : ''}> ${prefix}
</label>`;
        }
        armCheckedHtml += '</li>';
    }

    let html = `
<div class="pd_cfg_main">
  <div>请选择想批量熔炼的装备种类：</div>
  <ul data-name="smeltArmTypeList">${armCheckedHtml}</ul>
</div>
<div class="pd_cfg_btns">
  <button name="selectAll" type="button">全选</button>
  <button name="selectInverse" type="button">反选</button>
  <button name="smelt" type="button" style="color: #f00;">熔炼</button>
  <button data-action="close" type="button">关闭</button>
</div>`;
    let $dialog = Dialog.create(dialogName, '批量熔炼装备', html);
    let $smeltArmTypeList = $dialog.find('ul[data-name="smeltArmTypeList"]');

    $dialog.find('[name="smelt"]').click(function () {
        let typeList = [];
        $smeltArmTypeList.find('input[name="smeltArmsType"]:checked').each(function () {
            typeList.push($(this).val());
        });
        if (!typeList.length) return;
        readConfig();
        Config.defSmeltArmTypeList = typeList;
        writeConfig();
        if (!confirm('是否熔炼所选装备种类？')) return;
        Dialog.close(dialogName);
        smeltArms(typeList, safeId);
    }).end().find('[name="selectAll"]').click(() => Util.selectAll($smeltArmTypeList.find('input[name="smeltArmsType"]')))
        .end().find('[name="selectInverse"]').click(() => Util.selectInverse($smeltArmTypeList.find('input[name="smeltArmsType"]')));

    Dialog.show(dialogName);
    Script.runFunc('Item.showBatchSmeltArmsDialog_after_');
};

/**
 * 熔炼装备
 * @param {string[]} typeList 想要熔炼的装备种类
 * @param {string} safeId SafeID
 */
const smeltArms = function (typeList, safeId) {
    let successNum = 0, index = 0;
    let smeltInfo = {};

    /**
     * 熔炼
     * @param {number} armId 装备ID
     * @param {string} armGroup 装备组别
     * @param {string} armName 装备名称
     * @param {number} armNum 本轮熔炼的装备数量
     */
    const smelt = function (armId, armGroup, armName, armNum) {
        index++;
        $.ajax({
            type: 'POST',
            url: 'kf_fw_ig_mybpdt.php',
            data: `do=5&id=${armId}&safeid=${safeId}`,
            timeout: Const.defAjaxTimeout,
        }).done(function (html) {
            if (!html) return;
            let msg = Util.removeHtmlTag(html);
            console.log(`【${armName}】 ${msg}`);
            $('.pd_result[data-name="armResult"]:last').append(`<li>【${armName}】 ${msg}</li>`);
            $armArea.find(`[id="wp_${armId}"]`).fadeOut('normal', function () {
                $(this).remove();
            });

            let matches = /获得对应装备经验\[\+(\d+)]/.exec(msg);
            if (!matches) return;
            successNum++;
            if (!(armGroup in smeltInfo)) smeltInfo[armGroup] = {num: 0, exp: 0};
            smeltInfo[armGroup].num++;
            smeltInfo[armGroup].exp += parseInt(matches[1]);
            $wait.find('.pd_countdown').text(successNum);
            Script.runFunc('Item.smeltArms_after_');
        }).fail(function () {
            $('.pd_result[data-name="armResult"]:last').append(`<li>【${armName}】 <span class="pd_notice">连接超时</span></li>`);
        }).always(function () {
            if ($wait.data('stop')) complete();
            else {
                if (index === armNum) setTimeout(getNextArms, Const.minItemActionInterval);
                else setTimeout(() => $(document).dequeue('SmeltArms'), Const.minItemActionInterval);
            }
        });
    };

    /**
     * 获取当前的装备
     */
    const getCurrentArms = function () {
        let armList = [];
        $armArea.find('tr[id^="wp_"]').each(function () {
            let $this = $(this);
            let matches = /wp_(\d+)/.exec($this.attr('id'));
            if (!matches) return;
            let armId = parseInt(matches[1]);
            let armName = $this.find('> td:nth-child(3) > span:first').text().trim();
            let [, armGroup] = armName.split('的');
            if (armName && armGroup && typeList.includes(armName)) {
                armList.push({armId, armGroup, armName});
            }
        });
        if (!armList.length) {
            complete();
            return;
        }

        index = 0;
        $(document).clearQueue('SmeltArms');
        $.each(armList, function (i, {armId, armGroup, armName}) {
            $(document).queue('SmeltArms', () => smelt(armId, armGroup, armName, armList.length));
        });
        $(document).dequeue('SmeltArms');
    };

    /**
     * 获取下一批装备
     */
    const getNextArms = function () {
        getNextObjects(2, () => {
            if ($wait.data('stop')) complete();
            else setTimeout(getCurrentArms, Const.defAjaxInterval);
        });
    };

    /**
     * 操作完成
     */
    const complete = function () {
        $(document).clearQueue('SmeltArms');
        Msg.remove($wait);
        if ($.isEmptyObject(smeltInfo)) {
            alert('没有装备被熔炼！');
            return;
        }

        let armTypeNum = 0, totalExp = 0;
        let resultStat = '';
        for (let armGroup of Util.getSortedObjectKeyList(armGroupList, smeltInfo)) {
            armTypeNum++;
            let {exp, num} = smeltInfo[armGroup];
            totalExp += exp;
            resultStat += `【${armGroup}】 <i>装备<ins>-${num}</ins></i> <i>${armGroup}经验<em>+${exp.toLocaleString()}</em></i><br>`;
            let gain = {};
            gain[armGroup + '经验'] = exp;
            Log.push(
                '熔炼装备',
                `共有\`${num}\`个【\`${armGroup}\`】装备熔炼成功`,
                {gain, pay: {'装备': -num}}
            );
        }
        $('.pd_result[data-name="armResult"]:last').append(`
<li class="pd_stat">
  <b>统计结果（共有<em>${armTypeNum}</em>个组别中的<em>${successNum}</em>个装备熔炼成功）：</b> <i>装备经验<em>+${totalExp.toLocaleString()}</em></i><br>
  ${resultStat}
</li>`);
        console.log(`共有${armTypeNum}个组别中的${successNum}个装备熔炼成功，装备经验+${totalExp}`);
        Msg.show(
            `<strong>共有<em>${armTypeNum}</em>个组别中的<em>${successNum}</em>个装备熔炼成功</strong><i>装备经验<em>+${totalExp.toLocaleString()}</em></i>`, -1
        );
        setTimeout(() => getNextObjects(2), Const.defAjaxInterval);
        Script.runFunc('Item.smeltArms_complete_');
    };

    $armArea.parent().append('<ul class="pd_result" data-name="armResult"><li><strong>熔炼结果：</strong></li></ul>');
    let $wait = Msg.wait(
        '<strong>正在熔炼装备中&hellip;</strong><i>已熔炼：<em class="pd_countdown">0</em></i><a class="pd_stop_action" href="#">停止操作</a>'
    );
    getCurrentArms();
};

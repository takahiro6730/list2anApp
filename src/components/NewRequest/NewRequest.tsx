"use client";

import React, { useState } from "react";
import { requestGroupCheckData, requestGroupCheckData2 } from "@/constant/RequestGroup";
import LargeModal from "../common/Loader/LargeModal";
import { jwtDecode } from "jwt-decode";

interface RequestGroup {
    category: string;
    options: string[];
}

interface DecodedToken {
    id: string; // Adjust the type based on your token structure
    exp?: number; // Token expiry timestamp
    iat?: number;
    role: number;
}

const NewRequest: React.FC = () => {
    const datasets = [
        { name: "main_condition", data: requestGroupCheckData },
        { name: "sub_condition", data: requestGroupCheckData2 },
    ];

    const [checkedItems, setCheckedItems] = useState<{ [key: string]: { [key: string]: boolean } }>({});
    const [checkedCategories, setCheckedCategories] = useState<{ [key: string]: boolean }>({});
    const [areaSelection, setAreaSelection] = useState("");
    const [areaMemo, setAreaMemo] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [projectName, setProjectName] = useState("");
    const [mainCondition, setMainCondition] = useState("");
    const [subCondition, setSubCondition] = useState("");

    const handleCheckboxChange = (datasetName: string, category: string, option: string) => {
        setCheckedItems((prev) => ({
            ...prev,
            [`${datasetName}-${category}`]: {
                ...prev[`${datasetName}-${category}`],
                [option]: !prev[`${datasetName}-${category}`]?.[option], // Toggle checkbox
            },
        }));
    };

    const handleCategoryCheckboxChange = (datasetName: string, category: string, options: string[]) => {
        const isChecked = !checkedCategories[`${datasetName}-${category}`];

        setCheckedCategories((prev) => ({
            ...prev,
            [`${datasetName}-${category}`]: isChecked,
        }));
        setCheckedItems((prev) => ({
            ...prev,
            [`${datasetName}-${category}`]: options.reduce((acc, option) => {
                acc[option] = isChecked;
                return acc;
            }, {} as { [key: string]: boolean }),
        }));
    };

    // Function to get all selected checkbox values
    const getSelectedValues = () => {
        const selectedValues: { [key: string]: { [key: string]: string[] } } = {};
        Object.keys(checkedItems).forEach((key) => {
            const [datasetName, category] = key.split("-");
            const options = checkedItems[key];
            const selectedOptions = Object.keys(options).filter((option) => options[option]);
            if (selectedOptions.length > 0) {
                if (!selectedValues[datasetName]) selectedValues[datasetName] = {};
                selectedValues[datasetName][category] = selectedOptions;
            }
        });

        return selectedValues;
    };

    const confirmValues = () => {
        const selectedValues = getSelectedValues();
        setMainCondition(JSON.stringify(selectedValues.main_condition, null, 2))
        setSubCondition(JSON.stringify(selectedValues.sub_condition, null, 2))

    };

    const handleSubmit = async () => {
        const token = localStorage.getItem('listan_token');
        if (!token) {
            alert('User is not authenticated. Please log in.');
            return;
        }

        let userId;
        try {
            // Decode the token to extract user information
            const decodedToken = jwtDecode<DecodedToken>(token) // jwtDecode automatically decodes the token
            userId = decodedToken.id; // Extract the user ID
        } catch (error) {
            console.error('Error decoding token:', error);
            alert('トークンが無効です。もう一度ログインしてください。');
            return;
        }

        const selectedValues = getSelectedValues();

        const requestData = {
            userId: userId, // Replace with the actual user ID
            projectName,
            mainCondition: selectedValues.main_condition || {}, // Ensure it's an object
            subCondition: selectedValues.sub_condition || {}, // Ensure it's an object
            areaSelection,
            areaMemo,
            completeState: 0,
        };

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/add_request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Request saved successfully:', data);
                alert('正常に保存されました');
            } else {
                console.error('Failed to save request:', response.statusText);
                alert('保存に失敗しました');
            }
        } catch (error) {
            console.error('Error saving request:', error);
            alert('保存中にエラーが発生しました。');
        }
    }

    return (
        <div className="rounded-sm border border-stroke shadow-default bg-slate-900 p-4">
            <div>
                <div className="my-4">
                    <label htmlFor="project_name" className="block mb-2 text-base font-medium text-gray-900 text-white">プロジェクト名</label>
                    <input type="text" id="project_name" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
                        onChange={(e) => { setProjectName(e.target.value) }}
                        value={projectName}
                        required />
                </div>
            </div>
            {datasets.map((dataset, datasetIndex) => (
                <div key={datasetIndex}>
                    <h2 className="text-lg font-semibold text-white mb-4">{(dataset.name === "main_condition")?"業種の絞込み" : "その他条件の絞込み"}</h2>
                    <table className="w-full border-collapse border border-gray-700">
                        <tbody>
                            {dataset.data.map((item: RequestGroup, index: number) => (
                                <tr key={index} className="even:bg-gray-800 odd:bg-gray-700 text-white">
                                    <td className="border border-gray-700 p-2 align-top min-w-16">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={`category-${dataset.name}-${item.category}`}
                                                checked={checkedCategories[`${dataset.name}-${item.category}`] || false}
                                                onChange={() =>
                                                    handleCategoryCheckboxChange(dataset.name, item.category, item.options)
                                                }
                                                className="form-checkbox text-blue-500 mr-2"
                                            />
                                            <label
                                                htmlFor={`category-${dataset.name}-${item.category}`}
                                                className="cursor-pointer"
                                            >
                                                {item.category}
                                            </label>
                                        </div>
                                    </td>
                                    <td className="border border-gray-700 p-2">
                                        <ul className="flex flex-wrap list-none">
                                            {item.options.map((option: string, idx: number) => (
                                                <li key={idx} className="flex items-center mx-4">
                                                    <input
                                                        type="checkbox"
                                                        id={`${dataset.name}-${item.category}-${option}`}
                                                        checked={
                                                            checkedItems[`${dataset.name}-${item.category}`]?.[option] || false
                                                        }
                                                        onChange={() =>
                                                            handleCheckboxChange(dataset.name, item.category, option)
                                                        }
                                                        className="form-checkbox text-blue-500"
                                                    />
                                                    <label
                                                        htmlFor={`${dataset.name}-${item.category}-${option}`}
                                                        className="cursor-pointer ml-2"
                                                    >
                                                        {option}
                                                    </label>
                                                </li>
                                            ))}
                                        </ul>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
            <div>
                <div className="my-4">
                    <label htmlFor="area_selection" className="block mb-2 text-base font-medium text-gray-900 text-white">エリアの絞り込み</label>
                    <input type="text" id="area_selection" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
                        onChange={(e) => { setAreaSelection(e.target.value) }}
                        value={areaSelection}
                        required />
                </div>
                <div className="my-4">
                    <label htmlFor="area_memo" className="block mb-2 text-base font-medium text-gray-900 text-white">その他備考</label>
                    <input type="text" id="area_memo" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
                        onChange={(e) => { setAreaMemo(e.target.value) }}
                        value={areaMemo}
                        required />
                </div>
            </div>
            <div>
                <button
                    onClick={() => { history.back() }}
                    className="mt-4 mx-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                    閉じる
                </button>
                <button
                    onClick={() => {
                        setIsAddModalOpen(true)
                        confirmValues()
                    }}
                    className="mt-4 mx-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    確認画面
                </button>
            </div>
            <LargeModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
                <div className="space-y-4 w-full text-white">
                    <div>
                        <div className="relative z-20 bg-gray-500 border-gray-300">
                            <div className="my-4">
                                <label htmlFor="project_name_confirm" className="block mb-2 text-base font-medium text-gray-900 text-white">エリアの絞り込み</label>
                                <input type="text" id="project_name_confirm" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
                                    onChange={(e) => { setProjectName(e.target.value) }}
                                    value={projectName}
                                    required
                                    readOnly
                                />
                            </div>
                            <div className="my-4">
                                <label htmlFor="main_condition_confirm" className="block mb-2 text-base font-medium text-gray-900 text-white">業種の絞込み</label>
                                <textarea id="main_condition_confirm" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
                                    value={mainCondition}
                                    required
                                    readOnly
                                />
                            </div>
                            <div className="my-4">
                                <label htmlFor="sub_condition_confirm" className="block mb-2 text-base font-medium text-gray-900 text-white">その他条件の絞込み</label>
                                <textarea id="sub_condition_confirm" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
                                    value={subCondition}
                                    required
                                    readOnly
                                />
                            </div>
                            <div className="my-4">
                                <label htmlFor="area_selection_confirm" className="block mb-2 text-base font-medium text-gray-900 text-white">エリアの絞り込み</label>
                                <input type="text" id="area_selection_confirm" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
                                    onChange={(e) => { setAreaSelection(e.target.value) }}
                                    value={areaSelection}
                                    required
                                    readOnly
                                />
                            </div>
                            <div className="my-4">
                                <label htmlFor="area_memo_confirm" className="block mb-2 text-base font-medium text-gray-900 text-white">その他備考</label>
                                <input type="text" id="area_memo_confirm" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
                                    onChange={(e) => { setAreaMemo(e.target.value) }}
                                    value={areaMemo}
                                    required
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <p>この内容でよろしいでしょうか？
                        </p>
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={() => setIsAddModalOpen(false)}
                            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 mx-4"
                        >
                            戻る
                        </button>
                        <button
                            onClick={() => {
                                setIsAddModalOpen(false);
                                handleSubmit();
                            }}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mx-4"
                        >
                            登録する
                        </button>
                    </div>
                </div>
            </LargeModal>
        </div>
    );
};

export default NewRequest;